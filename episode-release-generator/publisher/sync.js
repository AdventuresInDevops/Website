/* eslint-disable no-console */

// spreakerSyncService.js

const fsRaw = require('fs');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const { DateTime } = require('luxon');
const { distance: levenshtein } = require('fastest-levenshtein');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { AuthressClient } = require('@authress/sdk');
const githubAction = require('@actions/core');
const { parseStringPromise: parseXml } = require('xml2js');

const util = require('util');
const { exec } = require('child_process');
const execAsync = util.promisify(exec);

// https://www.spreaker.com/cms/statistics/downloads/shows/6102036
const SPREAKER_SHOW_ID = "6102036";
const UPLOAD_BUCKET = 'storage.adventuresindevops.com';
const episodesReleasePath = path.resolve(__dirname, '../../', 'episodes');

const s3Client = new S3Client({ region: 'us-east-1' });

/**
 * Calculates the Levenshtein distance-based similarity percentage between two strings.
 * @param {string} s1 - First string.
 * @param {string} s2 - Second string.
 * @returns {number} Similarity percentage (0-100).
 */
function calculateSimilarityPercentage(s1, s2) {
  if (!s1 || !s2) { return 0; }
  const longer = Math.max(s1.length, s2.length);
  if (longer === 0) {return 100;} // Both are empty strings, considered 100% similar
  const distance = levenshtein(s1.toLowerCase(), s2.toLowerCase()); // Case-insensitive comparison
  return ((longer - distance) / longer) * 100;
}

/**
 * Checks if two Luxon DateTime objects are within a specified number of days of each other.
 * Time components are ignored; only the date part is compared.
 * @param {DateTime} luxonDate1 - First date.
 * @param {DateTime} luxonDate2 - Second date.
 * @returns {boolean} True if dates are within tolerance, false otherwise.
 */
function isDateWithinDays(luxonDate1, luxonDate2) {
  // Set to start of day to compare only dates, ignoring time
  const d1 = luxonDate1.startOf('day');
  const d2 = luxonDate2.startOf('day');
  const diff = d1.diff(d2, 'days').days;
  return Math.abs(diff) <= 14;
}

/**
 * Parses the YAML frontmatter from a Markdown string.
 * @param {string} mdContent - The full Markdown content.
 * @returns {object} An object containing 'frontmatter' (parsed YAML) and 'content' (remaining Markdown).
 * @throws {Error} If YAML frontmatter parsing fails.
 */
function parseMarkdownFrontmatter(mdContent, episodeFileName) {
  const frontmatterMatch = mdContent.match(/^---\s*\n(.*)\n---\s*\n(.*)/s);
  if (!frontmatterMatch) {
    // If no frontmatter, treat entire content as raw markdown with empty frontmatter
    return { frontmatter: {}, content: mdContent.trim(), date: null };
  }
  const frontmatterStr = frontmatterMatch[1];
  const content = frontmatterMatch[2].trim();
  try {
    const frontmatter = yaml.load(frontmatterStr);
    const date = frontmatter?.date?.toISOString() ?? episodeFileName.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
    return { frontmatter, content, date };
  } catch (e) {
    throw new Error(`Failed to parse YAML frontmatter: ${e.message}`);
  }
}

/**
 * Cleans Markdown content for Spreaker description field.
 * Strips HTML/JSX, images, and preserves only valid Markdown text and links.
 * @param {string} episodeLink - Link to specific episode
 * @param {string} markdownContent - The raw Markdown content.
 * @returns {string} Cleaned content suitable for Spreaker.
 */
async function cleanDescriptionForPublishing(episodeLink, markdownContent) {
  const initialCleanedContent = markdownContent.replace(/^import .* from '.*?'(?:;|\n)/gm, '');

  // Extract the Speaker Callout component and replace them with markdown
  const sponsorRegex = /<SponsorCallout\b[^>]*\/>/g;
  const attrRegex = /name="([^"]+)"|link="([^"]+)"/g;

  const sponsor = {};
  for (const callout of initialCleanedContent.matchAll(sponsorRegex)) {
    let match;
    while ((match = attrRegex.exec(callout[0])) !== null) {
      if (match[1]) {sponsor.name = match[1];}
      if (match[2]) {sponsor.link = match[2];}
    }
  }

  let cleanedContent = initialCleanedContent;
  // 1. We cannot trust ourselves to use HTTPS everywhere, and we also cannot trust the providers to do it., so let's just make sure all links are HTTPS
  cleanedContent = cleanedContent.replace(/http:\/\//g, 'https://');

  // 2. Remove all HTML/JSX components and their content (e.g., <GuestCallout ... />, <div>...</div>)
  // This regex targets any HTML-like tags, including custom JSX ones.
  cleanedContent = cleanedContent.replace(/<[^>]*>.*?<\/[^>]*>/gs, ''); // Paired tags with content
  cleanedContent = cleanedContent.replace(/<[^>]*?\/>/g, ''); // Self-closing tags

  // 3. Remove Images (e.g., ![alt text](./path/to/image.jpeg))
  cleanedContent = cleanedContent.replace(/!\[.*?\]\(.*?\)/g, '');

  // 4. Reduce multiple blank lines to at most two newlines
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  const shareLink = `[Share Episode](${episodeLink})`;
  const sponsorContent = sponsor.name && sponsor.link && `Episode Sponsor: [${sponsor.name}](${sponsor.link}) - ${sponsor.link}` || '';
  // https://en.wikibooks.org/wiki/Unicode/List_of_useful_symbols
  const header = [shareLink, sponsorContent].filter(v => v).join(' ⸺ ');
  cleanedContent = `${header}<br /><br />${cleanedContent}`;

  const { marked } = await import('marked');
  marked.use({
    extensions: [{
      // Remove header sections and prefer bolding the header name since podcast descriptions on podcast sites won't understand them
      name: 'heading',
      renderer(token) {
        return `<b>${this.parser.parseInline(token.tokens)}</b><br />`;
      }
    }],

    renderer: {
      text(token) {
        // Parse text elements with tokens as normal tokens
        if (token.tokens) {
          return false;
        }

        // but all other text elements should just be used exactly as is.
        return token.text;
      },
      link(token) {
        const text = this.parser.parseInline(token.tokens);
        if (token.href.startsWith('../')) {
          console.error('************************************************************************');
          console.error(`Episode content that needs to be fixed: ${markdownContent}`);
          throw Error(`We cannot create a [link]() correctly when the path starts with ../ because that will not be resolved by podcast platforms, update the link to be absolute.`);
        }

        if (token.href.includes('adventuresindevops.com') || token.href.includes('dev0ps.fyi')) {
          return `<a href="${token.href}" target="_blank">${text}</a>`;
        }

        return `<a href="${token.href}" target="_blank" rel="noreferrer noopener">${text}</a>`;
      }
    }
  });
  const markdownResult = marked.parse(cleanedContent);

  return markdownResult.trim()
  // Remove whitespace from published html
  .split('\n').join('');
}

let cachedAccessToken = null;
async function getAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  try {
    const token = await githubAction.getIDToken('https://api.authress.io');
    const authressClient = new AuthressClient({ authressApiUrl: 'https://login.adventuresindevops.com' }, () => token);
    const credentialsResult = await authressClient.connections.getConnectionCredentials('con_oggz69yXV6cfTGQHS4BTAc', 'u5byrPns7wSpncwXPwKHxEh6f');
    
    cachedAccessToken = credentialsResult.data.accessToken;
    return cachedAccessToken;
  } catch (error) {
    console.error('Failed to get spreaker API token', error);
    throw error;
  }
}

/**
 * Reads content from all 'index.md' files found in subdirectories of episodesReleasePath.
 * Assumes Docusaurus structure where each episode is a subdirectory with index.md.
 * @returns {Promise<Array<Episode>>} A promise that resolves to an array of Markdown file contents.
 * @throws {Error} If the base directory cannot be read.
 */
async function getEpisodesFromDirectory() {
  const allMdContents = [];
  try {
    const entries = await fs.readdir(episodesReleasePath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const slugContainsEpisodeNumber = entry.name.match(/^(?:\d{3,})-[^\d](.*)$/);
      if (!slugContainsEpisodeNumber) {
        continue;
      }

      const indexPath = path.join(episodesReleasePath, entry.name, 'index.md');
      const mdContent = await fs.readFile(indexPath, 'utf-8');

      const { frontmatter, content, date } = parseMarkdownFrontmatter(mdContent, entry.name);

      if (!date) {
        throw Error(`Missing 'date' in frontmatter for episode in file '${indexPath}'`);
      }

      const episodeDate = DateTime.fromISO(date, { zone: 'UTC' });
      // Skip old episodes before automation and before episodes had numbers in them.
      if (episodeDate < DateTime.fromISO('2025-11-11')) {
        continue;
      }

      const linkSlug = entry.name;
      const episodeLink = `https://adventuresindevops.com/episodes/${linkSlug}`;
      const sanitizedBody = await cleanDescriptionForPublishing(episodeLink, content);

      // Spreaker description max length is 4000 characters, and realistically this is the standard across many platforms as well.
      if (sanitizedBody.length > 4000) {
        console.warn(`WARNING: Description for '${entry.name}' truncated to 4000 characters (${sanitizedBody.length} chars originally).`);
        throw Error(`WARNING: Description for '${entry.name}' truncated to 4000 characters (${sanitizedBody.length} chars originally).`);
      }

      allMdContents.push({
        slug: entry.name?.match(/^[\d-]+(.*)$/)[1],
        episodeNumber: slugContainsEpisodeNumber ? parseInt(slugContainsEpisodeNumber[1], 10) : null,
        date: episodeDate,
        linkSlug,
        episodeLink,
        title: frontmatter.title,
        sanitizedBody,
        episodeImageBlob: fsRaw.createReadStream(path.join(episodesReleasePath, entry.name, frontmatter.image))
      });
      console.log(`    ${indexPath}`);
    }
  } catch (dirError) {
    console.error(dirError);
    throw new Error(`Failed to read directory '${episodesReleasePath}': ${dirError.message}`);
  }
  return allMdContents;
}

/**
 * Creates a new episode on Spreaker.

 * @returns {object|null} The created episode object from Spreaker, or null on failure.
 * @throws {Error} If the API request fails.
 */
async function createSpreakerEpisode(episode) {
  const accessToken = await getAccessToken();
  const url = `https://api.spreaker.com/v2/shows/${SPREAKER_SHOW_ID}/episodes`;
  const headers = { "Authorization": `Bearer ${accessToken}` };

  if (!episode.episodeNumber) {
    console.error('*****', episode);
    throw Error('Episode does not contain an episode number');
  }

  const episodeExists = await getSpreakerPublishedEpisode({ episodeNumber: episode.episodeNumber });
  if (episodeExists) {
    return;
  }

  const formData = new FormData();
  formData.append('show_id', SPREAKER_SHOW_ID);
  formData.append('title', `${episode.slug} ${episode.episodeNumber}`); // This also generates the slug property
  formData.append('episode_number', episode.episodeNumber);
  formData.append('tags', `${episode.slug}`);

  const audioFileS3Key = `storage/episodes/${episode.episodeNumber}-${episode.slug}/episode.mp3`;
  const checkAudioFileCommand = {
    Bucket: UPLOAD_BUCKET,
    Key: audioFileS3Key
  };
  
  const audioFileFromS3 = await s3Client.send(new GetObjectCommand(checkAudioFileCommand));
  const arrayBuffer = Buffer.concat(await audioFileFromS3.Body.toArray());
  const audioBlob = new Blob([arrayBuffer], { type: audioFileFromS3.ContentType });
  formData.append('media_file', audioBlob, 'download.mp3');

  try {
    const response = await axios.post(url, formData, { headers });
    if (response.data?.response.episode) {
      console.log(`    Creating Episode '${response.data.response.episode.title}' (ID: ${response.data.response.episode.episode_id})`);

      const updateFormData = new FormData();
      updateFormData.append('episode_number', episode.episodeNumber);
      const updateUrl = `https://api.spreaker.com/v2/episodes/${response.data.response.episode.episode_id}`;
      await axios.post(updateUrl, updateFormData, { headers });
      return;
    }
    throw new Error(`Failed to create Spreaker episode (Status: ${response.status}): ${response.data}`);
  } catch (error) {
    const errorMessage = error.response.data?.response?.error?.messages ? error.response.data.response.error.messages.join(', ') : error.message;
    throw new Error(`Failed to create Spreaker episode (Status: ${error.response?.status}): ${errorMessage}`);
  }
}

/**
 * Get the episode on Spreaker.

 * @returns {object|null} The created episode object from Spreaker, or null on failure.
 * @throws {Error} If the API request fails.
 */
async function getSpreakerPublishedEpisode({ episodeSlug, episodeNumber }) {
  const accessToken = await getAccessToken();
  const url = `https://api.spreaker.com/v2/shows/${SPREAKER_SHOW_ID}/episodes`;
  const headers = { "Authorization": `Bearer ${accessToken}` };
  const params = { limit: 100, order: "desc", filter: 'listenable' };

  try {
    const response = await axios.get(url, { headers, params });
    if (!Array.isArray(response.data?.response?.items) || !response.data.response.items.length) {
      throw Error(`Spreaker Episode List is not a valid list`);
    }

    const matchingSpreakerEpisodeSummary = response.data.response.items.find(e => {
      if (episodeNumber && e.episode_number === episodeNumber) {
        return true;
      }

      if (!episodeSlug) {
        return false;
      }

      if (e.title.includes(episodeSlug)) {
        return true;
      }

      return false;
    });

    if (!matchingSpreakerEpisodeSummary) {
      return null;
    }

    const episodeUrl = `https://api.spreaker.com/v2/episodes/${matchingSpreakerEpisodeSummary.episode_id}`;
    const episodeResponse = await axios.get(episodeUrl, { headers });

    const audioFileResponse = await axios.head(`https://api.spreaker.com/v2/episodes/${matchingSpreakerEpisodeSummary.episode_id}/download.mp3`);
    const contentLength = audioFileResponse.headers['content-length'];
    const fileSizeInBytes = parseInt(contentLength, 10);

    return {
      episodeNumber: episodeResponse.data.response.episode.episode_number,
      audioUrl: `https://dts.podtrac.com/redirect.mp3/api.spreaker.com/download/episode/${matchingSpreakerEpisodeSummary.episode_id}/download.mp3`,
      audioFileSize: fileSizeInBytes,
      audioDurationSeconds: Math.floor(episodeResponse.data.response.episode.duration / 1000)
    };
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    throw new Error(`Failed to fetch Spreaker episodes (Status: ${error.response?.status}): ${errorMessage}`);
  }
};

/**
 * Main function to sync Docusaurus Markdown podcast episodes with Spreaker.
 * This function is idempotent: it will not create duplicate episodes based on fuzzy matching.
 * @returns {Promise<void>} A promise that resolves when the synchronization is complete.
 * @throws {Error} For any critical errors like missing parameters, invalid configuration, or API failures.
 */
async function syncEpisodesToSpreaker() {
  const publishedRssFeedResponse = await fetch('https://adventuresindevops.com/rss.xml');
  const xmlObject = await parseXml(await publishedRssFeedResponse.text(), { explicitArray: false });
  xmlObject.rss.channel.copyright = 'Rhosys AG';

  const foundEpisodes = await getEpisodesFromDirectory();
  const sortedEpisodes = foundEpisodes.sort((a, b) => a.date.toISO().localeCompare(b.date.toISO())).slice(-5);
  for (const episode of sortedEpisodes) {
    const mdTitle = episode.title;

    if (!mdTitle) {
      console.warn(`WARNING: Skipping Markdown content due to missing 'title' or 'date' in its frontmatter.`);
      throw new Error(`Invalid episode info ${mdTitle}`);
    }

    let existingSpreakerEpisode = null;
    for (const existingPublishedEpisode of xmlObject.rss.channel.item) {
      const title = existingPublishedEpisode.title;
      const episodePublishedDate = DateTime.fromRFC2822(existingPublishedEpisode.pubDate);
      const titleSimilarity = calculateSimilarityPercentage(mdTitle, title);
      const dateMatches = isDateWithinDays(episode.date, episodePublishedDate);

      if (titleSimilarity >= 90 && dateMatches || existingPublishedEpisode.link?.includes(episode.slug)) {
        console.log(`    Local: '${mdTitle}' (${episode.date.toISO()}) --------- RSS Episode '${episode.slug} ${existingPublishedEpisode['itunes:episode']}'`);
        existingSpreakerEpisode = true;
        break;
      }
    }

    if (!existingSpreakerEpisode) {
      await createSpreakerEpisode(episode);
    }
  }
}

async function getCurrentlySyncedS3EpisodeSlugs() {
  const parentPrefix = 'storage/episodes';
  // 1. Ensure the prefix ends with a slash for proper folder simulation
  const prefix = parentPrefix.endsWith('/') ? parentPrefix : `${parentPrefix}/`;
  
  // 2. Initialize the list to store all prefixes found
  const allPrefixes = [];
  let continuationToken;
  do {
    const params = {
      Bucket: UPLOAD_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken || undefined
    };
    const data = await s3Client.send(new ListObjectsV2Command(params));

    // 4. Extract CommonPrefixes (sub-folders) and add them to the list
    if (data.CommonPrefixes) {
      allPrefixes.push(...data.CommonPrefixes.map(p => p.Prefix));
    }

    continuationToken = data.NextContinuationToken;
  } while (continuationToken);

  return allPrefixes.map(p => p.replace(/[/]$/, '').split('/').slice(-1)[0]);
}

async function ensureS3Episode() {
  const completeDirectory = `${process.env.HOME}/git/podcast/Podcast Episodes Completed`;
  const entries = await fs.readdir(completeDirectory, { withFileTypes: true });

  const filesFromDirectory = entries.map(e => e.name).filter(name => {
    return name.endsWith('.srt') || name.endsWith('.txt') || name.endsWith('.mkv') || name.includes('.raw.');
  });

  const transcriptFileNames = filesFromDirectory.filter(f => f.match('transcript.'));
  if (transcriptFileNames.length !== 2) {
    throw Error('Transcripts not found in the completed directory');
  }
  const videoFileNames = filesFromDirectory.filter(f => f.match(/(mp4|mov|avi|mkv)$/));
  if (!videoFileNames.length) {
    throw Error('No Episodes found in the completed directory');
  }
  const actualVideoPath = path.join(completeDirectory, videoFileNames.find(f => !f.includes('.raw.')));
  
  const episodeSlug = path.basename(actualVideoPath).replace(/[.]\w+$/, '');

  const publishedRssFeedResponse = await fetch('https://adventuresindevops.com/rss.xml');
  const xmlObject = await parseXml(await publishedRssFeedResponse.text(), { explicitArray: false });
  const latestExistingEpisodeNumber = Math.max(...xmlObject.rss.channel.item.map(i => i['itunes:episode']).filter(number => number.match(/\d{3,}/)).map(n => parseInt(n, 10)));

  const episodeNumber = latestExistingEpisodeNumber + 1;
  const audioFilePath = path.join(completeDirectory, `${episodeSlug}.mp3`);

  // Run ffmpeg to extract audio
  if (!entries.find(e => e.name === `${episodeSlug}.mp3`)) {
    console.log('Audio MP3 not found, generating');
    const command = `ffmpeg -i "${actualVideoPath}" -q:a 0 -map a "${audioFilePath}"`;
    const { stdout, stderr } = await execAsync(command);
    console.log('FFmpeg Output:', stdout, stderr);
  }

  await Promise.all(transcriptFileNames.map(async transcriptFileName => {
    const contentTypeMap = {
      srt: 'application/x-subrip',
      txt: 'text/plain',
      vtt: 'text/vtt'
    };
    const extension = transcriptFileName.split('.').slice(-1)[0];

    let transcriptBuffer;
    try {
      transcriptBuffer = Buffer.concat(await fsRaw.createReadStream(path.join(completeDirectory, transcriptFileName)).toArray());
    } catch (error) {
      console.error(`[GetEpisodesFromDirectory] Could not find transcripts for episode`);
      throw error;
    }
    
    const transcriptParams = {
      Bucket: UPLOAD_BUCKET,
      Key: `storage/episodes/${episodeNumber}-${episodeSlug}/transcript.${extension}`,
      Body: transcriptBuffer,
      ContentType: contentTypeMap[extension] || 'text/plain'
    };
    await s3Client.send(new PutObjectCommand(transcriptParams));
  }));

  const audioFileS3Key = `storage/episodes/${episodeNumber}-${episodeSlug}/episode.mp3`;
  const checkAudioFileCommand = {
    Bucket: UPLOAD_BUCKET,
    Key: audioFileS3Key
  };
  try {
    await s3Client.send(new HeadObjectCommand(checkAudioFileCommand));
  } catch (error) {
    if (error.message !== 'NotFound') {
      throw error;
    }

    let audioBuffer;
    try {
      audioBuffer = Buffer.concat(await fsRaw.createReadStream(audioFilePath).toArray());
    } catch (uploadError) {
      console.error(`[EnsureS3Episode] Failed to upload audio for episode`, uploadError);
      throw uploadError;
    }

    const audioParams = {
      Bucket: UPLOAD_BUCKET,
      Key: audioFileS3Key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg'
    };
    await s3Client.send(new PutObjectCommand(audioParams));
  }

  /** ** VIDEO UPLOAD ********/
  const videoFileS3Key = `storage/episodes/${episodeNumber}-${episodeSlug}/episode.mkv`;
  const checkVideoFileCommand = {
    Bucket: UPLOAD_BUCKET,
    Key: videoFileS3Key
  };
  try {
    await s3Client.send(new HeadObjectCommand(checkVideoFileCommand));
  } catch (error) {
    if (error.message !== 'NotFound') {
      throw error;
    }

    let videoBuffer;
    try {
      videoBuffer = Buffer.concat(await fsRaw.createReadStream(actualVideoPath).toArray());
    } catch (uploadError) {
      console.error(`[EnsureS3Episode] Could not upload video for episode`, uploadError);
      throw uploadError;
    }

    const videoParams = {
      Bucket: UPLOAD_BUCKET,
      Key: videoFileS3Key,
      Body: videoBuffer,
      ContentType: 'video/matroska'
    };
    await s3Client.send(new PutObjectCommand(videoParams));
  }
  /** *********/

  const googleDriveLocation = 'https://drive.google.com/drive/folders/1o-hrzPQIwNmjeukmKfg9bSyoolneJkzD';
  console.log('**** Success, now upload the raw video to the google drive location *****', googleDriveLocation);
}

module.exports.getEpisodesFromDirectory = getEpisodesFromDirectory;
module.exports.syncEpisodesToSpreaker = syncEpisodesToSpreaker;
module.exports.ensureS3Episode = ensureS3Episode;
module.exports.getCurrentlySyncedS3EpisodeSlugs = getCurrentlySyncedS3EpisodeSlugs;
module.exports.getSpreakerPublishedEpisode = getSpreakerPublishedEpisode;
