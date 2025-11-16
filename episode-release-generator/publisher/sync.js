/* eslint-disable no-console */

// spreakerSyncService.js

const fsRaw = require('fs');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const { DateTime } = require('luxon');
const { distance: levenshtein } = require('fastest-levenshtein');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { AuthressClient } = require('@authress/sdk');
const githubAction = require('@actions/core');
const fetch = require('node-fetch');

// https://www.spreaker.com/cms/statistics/downloads/shows/6102036
const SPREAKER_SHOW_ID = "6102036";
const episodesReleasePath = path.resolve(__dirname, '../../', 'episodes');

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
function parseMarkdownFrontmatter(mdContent) {
  const frontmatterMatch = mdContent.match(/^---\s*\n(.*)\n---\s*\n(.*)/s);
  if (!frontmatterMatch) {
    // If no frontmatter, treat entire content as raw markdown with empty frontmatter
    return { frontmatter: {}, content: mdContent.trim() };
  }
  const frontmatterStr = frontmatterMatch[1];
  const content = frontmatterMatch[2].trim();
  try {
    const frontmatter = yaml.load(frontmatterStr);
    return { frontmatter, content };
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
      // Add extra spaces to separate the content
      name: 'paragraph',
      renderer(token) {
        return `${this.parser.parseInline(token.tokens)}<br /><br />`;
      }
    },
    {
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
 * Fetches the last 10 episodes for a given Spreaker show.
 * @returns {Array<object>} An array of Spreaker episode objects.
 * @throws {Error} If the API request fails.
 */
async function getSpreakerEpisodes() {
  const accessToken = await getAccessToken();
  const url = `https://api.spreaker.com/v2/shows/${SPREAKER_SHOW_ID}/episodes`;
  const headers = { "Authorization": `Bearer ${accessToken}` };
  const params = { limit: 10, order: "desc", filter: 'editable' };

  try {
    const response = await axios.get(url, { headers, params });
    if (response.data && response.data.response && Array.isArray(response.data.response.items)) {
      const results = await Promise.all(response.data.response.items.map(async episodeSummaryInfo => {
        const episodeUrl = `https://api.spreaker.com/v2/episodes/${episodeSummaryInfo.episode_id}`;
        const episodeResponse = await axios.get(episodeUrl, { headers });

        const episodeId = episodeResponse.data.response.episode.episode_id;
        const title = episodeResponse.data.response.episode.title;
        const episodeLink = episodeResponse.data.response.episode.episode_link;
        const spreakerAdminUrl = `https://www.spreaker.com/cms/episodes/${episodeId}/edit/info`;
        if (!episodeLink?.startsWith('https://adventuresindevops.com')) {
          throw Error(`Episode ${title} does not contain the appropriate episode link: ${spreakerAdminUrl}`);
        }

        return {
          title,
          type: episodeResponse.data.response.episode.type,
          episodeNumber: episodeResponse.data.response.episode.episode_number,
          episodeLink,

          // Spreaker API provides 'published_at' as ISO 8601 string.
          // Ref: https://developers.spreaker.com/api/api-v2.html#object-episode -> 'published_at' field
          publishedDateTime: DateTime.fromISO(episodeResponse.data.response.episode.published_at, { zone: 'utc' })
        };
      }));
      return results;
    }
    return [];
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    throw new Error(`Failed to fetch Spreaker episodes (Status: ${error.response?.status}): ${errorMessage}`);
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

      const entryMatch = entry.name.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
      if (!entryMatch) {
        continue;
      }

      const indexPath = path.join(episodesReleasePath, entry.name, 'index.md');
      const mdContent = await fs.readFile(indexPath, 'utf-8');

      const { frontmatter, content } = parseMarkdownFrontmatter(mdContent);

      const episodeDate = DateTime.fromISO(frontmatter.date?.toISOString() || entryMatch[1], { zone: 'UTC' });
      // Skip old episodes before automation
      if (episodeDate < DateTime.fromISO('2025-08-01')) {
        continue;
      }

      const slug = entryMatch[2];
      const episodeLink = `https://adventuresindevops.com/episodes/${episodeDate.toISO().substring(0, 10).replace(/-/g, '/')}/${slug}`;
      const sanitizedBody = await cleanDescriptionForPublishing(episodeLink, content);

      // Spreaker description max length is 4000 characters, and realistically this is the standard across many platforms as well.
      if (sanitizedBody.length > 4000) {
        console.warn(`WARNING: Description for '${entry.name}' truncated to 4000 characters (${sanitizedBody.length} chars originally).`);
        throw Error(`WARNING: Description for '${entry.name}' truncated to 4000 characters (${sanitizedBody.length} chars originally).`);
      }

      allMdContents.push({
        slug,
        date: episodeDate,
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
async function createSpreakerEpisode(episode, latestEpisodeNumber) {
  const accessToken = await getAccessToken();
  // const url = `https://api.spreaker.com/v2/shows/${SPREAKER_SHOW_ID}/episodes`;
  const url = `https://api.spreaker.com/v2/episodes/drafts`;
  const headers = { "Authorization": `Bearer ${accessToken}` };

  const formData = new FormData();
  formData.append('show_id', SPREAKER_SHOW_ID);
  formData.append('title', episode.title);
  // formData.append('slug', episode.title); // The title object generates the slug, so be careful with what we put in the title
  formData.append('description_html', episode.sanitizedBody);
  formData.append('episode_number', latestEpisodeNumber);
  formData.append('episode_link', episode.episodeLink);
  formData.append('tags', `${episode.slug}, devops,security,leadership,product,software,architecture,microservices,career`);
  formData.append('image_file', episode.episodeImageBlob);
  // formData.append('media_file', fsRaw.createReadStream(episode.audioFile));

  try {
    const response = await axios.post(url, formData, { headers });
    if (response.data?.response.episode) {
      console.log(`    Creating Draft '${response.data.response.episode.title}' (ID: ${response.data.response.episode.episode_id})`);
      return response.data.response.episode;
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
module.exports.getSpreakerPublishedEpisode = async function getSpreakerPublishedEpisode(episodeTitle, episodeDate) {
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
      const titleSimilarity = calculateSimilarityPercentage(episodeTitle, e.title);
      const publishedDate = DateTime.fromFormat(e.published_at, 'yyyy-MM-dd hh:mm:ss', { zone: 'UTC' });

      if (!publishedDate || !publishedDate.isValid) {
        throw Error(`Episode published date in Spreaker is broken: ${e.title}`);
      }
      const dateMatches = isDateWithinDays(episodeDate, publishedDate);

      if (titleSimilarity < 90 || !dateMatches) {
        return false;
      }

      return true;
    });

    if (!matchingSpreakerEpisodeSummary) {
      return null;
    }

    const episodeUrl = `https://api.spreaker.com/v2/episodes/${matchingSpreakerEpisodeSummary.episode_id}`;
    const episodeResponse = await axios.get(episodeUrl, { headers });

    const episodeId = episodeResponse.data.response.episode.episode_id;
    const title = episodeResponse.data.response.episode.title;
    const episodeLink = episodeResponse.data.response.episode.episode_link;
    const spreakerAdminUrl = `https://www.spreaker.com/cms/episodes/${episodeId}/edit/info`;
    if (!episodeLink?.startsWith('https://adventuresindevops.com')) {
      throw Error(`Episode ${title} does not contain the appropriate episode link: ${spreakerAdminUrl}`);
    }

    const audioFileResponse = await axios.head(`https://api.spreaker.com/v2/episodes/${matchingSpreakerEpisodeSummary.episode_id}/download.mp3`);
    const contentLength = audioFileResponse.headers['content-length'];
    const fileSizeInBytes = parseInt(contentLength, 10);

    return {
      episodeNumber: episodeResponse.data.response.episode.episode_number,
      audioUrl: `https://dts.podtrac.com/redirect.mp3/api.spreaker.com/download/episode/${matchingSpreakerEpisodeSummary.episode_id}/download.mp3`,
      audioFileSize: fileSizeInBytes,
      audioDurationSeconds: Math.floor(episodeResponse.data.response.episode.duration / 1000),
      transcripts: episodeResponse.data.response.episode.transcripts_generated
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
async function syncEpisodesToSpreakerAndS3() {
  console.log(`FETCHING EXISTING EPISODES from Spreaker show ID: ${SPREAKER_SHOW_ID}...`);
  const existingSpreakerEpisodes = await getSpreakerEpisodes();
  console.log(`Found ${existingSpreakerEpisodes.length} existing Spreaker episodes.`);

  let latestEpisodeNumber = Math.max(...existingSpreakerEpisodes.map(e => e.episodeNumber));

  const foundEpisodes = await getEpisodesFromDirectory();
  const sortedEpisodes = foundEpisodes.sort((a, b) => a.date.toISO().localeCompare(b.date.toISO())).slice(-5);
  console.log('MATCHES:');
  for (const episode of sortedEpisodes) {
    const mdTitle = episode.title;

    if (!mdTitle) {
      console.warn(`WARNING: Skipping Markdown content due to missing 'title' or 'date' in its frontmatter.`);
      throw new Error(`Invalid episode info ${mdTitle}`);
    }

    let existingSpreakerEpisode = null;
    for (const existingEp of existingSpreakerEpisodes) {
      const spreakerTitle = existingEp.title;
      const spreakerDate = existingEp.publishedDateTime;
      const titleSimilarity = calculateSimilarityPercentage(mdTitle, spreakerTitle);
      const dateMatches = isDateWithinDays(episode.date, spreakerDate);

      if (titleSimilarity >= 90 && dateMatches || existingEp.episodeLink?.includes(episode.slug)) {
        console.log(`    Local: '${mdTitle}' (${episode.date.toISO()}) --------- Spreaker '${spreakerTitle}' (${spreakerDate.toISO()})`);
        existingSpreakerEpisode = existingEp;
        break;
      }
    }

    if (!existingSpreakerEpisode) {
      latestEpisodeNumber++;
      await ensureS3Episode(episode, latestEpisodeNumber);
      await createSpreakerEpisode(episode, latestEpisodeNumber);
    }
  }
}

async function ensureS3Episode(episode, episodeNumber, optionalAudioUrl) {
  const s3Client = new S3Client({ region: 'us-east-1' });

  const uploadData = {
    slug: episode.slug,
    date: episode.date,
    episodeLink: episode.episodeLink,
    episodeNumber,
    title: episode.title,
    sanitizedBody: episode.sanitizedBody
  };

  const params = {
    Bucket: 'storage.adventuresindevops.com',
    Key: `/storage/episodes/${episodeNumber}-${episode.slug}/metadata.json`,
    Body: JSON.stringify(uploadData, null, 2),
    ContentType: 'application/json'
  };
  await s3Client.send(new PutObjectCommand(params));

  if (optionalAudioUrl) {
    const checkAudioFileCommand = {
      Bucket: 'storage.adventuresindevops.com',
      Key: `/storage/episodes/${episodeNumber}-${episode.slug}/episode.mp3`
    };
    try {
      await s3Client.send(new HeadObjectCommand(checkAudioFileCommand));
      return;
    } catch (error) {
      if (error.name !== 'NotFound') {
        throw error;
      }
    }

    const audioResponse = await fetch(optionalAudioUrl);
    if (!audioResponse.ok) {
      console.log(`  Error: Download failed with status: ${audioResponse.status}. Skipping this episode.`);
      return;
    }

    const audioParams = {
      Bucket: 'storage.adventuresindevops.com',
      Key: `/storage/episodes/${episodeNumber}-${episode.slug}/episode.mp3`,
      Body: audioResponse.body,
      ContentType: audioResponse.headers.get('content-type') || 'application/octet-stream'
    };
    await s3Client.send(new PutObjectCommand(audioParams));
  }
}

module.exports.getEpisodesFromDirectory = getEpisodesFromDirectory;
module.exports.syncEpisodesToSpreakerAndS3 = syncEpisodesToSpreakerAndS3;
module.exports.ensureS3Episode = ensureS3Episode;
