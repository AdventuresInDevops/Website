/* eslint-disable no-console */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const { DateTime } = require('luxon');
const { AuthressClient } = require('@authress/sdk');
const githubAction = require('@actions/core');
const { parseStringPromise: parseXml } = require('xml2js');
const { getAudioBlobFromEpisode } = require('./sync');

// https://www.spreaker.com/cms/statistics/downloads/shows/6102036
const SPREAKER_SHOW_ID = "6102036";
const episodesReleasePath = path.resolve(__dirname, '../../', 'episodes');

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
  // Include non-breaking spaces so that it still looks good on mobile spotify and apple
  // .replace(/<br \/>(?!<)/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br />')
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

      const slugContainsEpisodeNumber = entry.name.match(/^(\d{3,})-[^\d].*$/);
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
        slug: entry.name?.match(/^[\d-]+([^\d].*)$/)[1],
        episodeNumber: slugContainsEpisodeNumber ? parseInt(slugContainsEpisodeNumber[1], 10) : null,
        date: episodeDate,
        linkSlug,
        episodeLink,
        title: frontmatter.title,
        sanitizedBody
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
      if (episodeNumber && e.title.includes(episodeNumber)) {
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
}

/**
 * Main function to sync Docusaurus Markdown podcast episodes with Spreaker.
 * This function is idempotent: it will not create duplicate episodes based on fuzzy matching.
 * @returns {Promise<void>} A promise that resolves when the synchronization is complete.
 * @throws {Error} For any critical errors like missing parameters, invalid configuration, or API failures.
 */
async function syncEpisodesToSpreaker() {
  // We use the published RSS Feed to as an early warning to prevent publishing unnecessary episodes
  // * The source of truth for publishing to Spreaker is always spreaker of course.
  const publishedRssFeedResponse = await fetch('https://adventuresindevops.com/rss.xml');
  const xmlObject = await parseXml(await publishedRssFeedResponse.text(), { explicitArray: false });
  xmlObject.rss.channel.copyright = 'Rhosys AG';

  const foundEpisodes = await getEpisodesFromDirectory();
  const sortedEpisodes = foundEpisodes.sort((a, b) => a.date.toISO().localeCompare(b.date.toISO())).slice(-5);
  for (const episode of sortedEpisodes) {
    const publishedEpisodes = xmlObject.rss.channel.item;
    if (publishedEpisodes.some(e => e['itunes:episode']) === episode.episodeNumber) {
      continue;
    }

    await ensureSpreakerEpisode(episode);
  }
}

/**
 * Creates a new episode on Spreaker.

 * @returns {object|null} The created episode object from Spreaker, or null on failure.
 * @throws {Error} If the API request fails.
 */
async function ensureSpreakerEpisode(episode) {
  const accessToken = await getAccessToken();
  const url = `https://api.spreaker.com/v2/shows/${SPREAKER_SHOW_ID}/episodes`;
  const headers = { "Authorization": `Bearer ${accessToken}` };

  if (!episode.episodeNumber) {
    console.error('');
    console.error('');
    console.error('Episode does not contain an episode number:', episode);
    throw Error('Episode does not contain an episode number');
  }

  const episodeExists = await getSpreakerPublishedEpisode({ episodeNumber: episode.episodeNumber });
  if (episodeExists) {
    return;
  }

  const formData = new FormData();
  formData.append('show_id', SPREAKER_SHOW_ID);
  formData.append('title', `${episode.fullSlug} ${episode.episodeNumber}`);
  formData.append('episode_number', episode.episodeNumber);
  formData.append('tags', `${episode.fullSlug}`);

  const audioBlob = getAudioBlobFromEpisode(episode);
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

    console.error('');
    console.error('');
    console.error('Failed to create Speaker episode there was no response after attempting to create the episode in Spreaker and update the episode number', response.data);
    throw new Error(`Failed to create Spreaker episode (Status: ${response.status}): ${response.data}`);
  } catch (error) {
    console.error('');
    console.error('');
    console.error('Failed to create Speaker episode', error);
    const errorMessage = error.response.data?.response?.error?.messages ? error.response.data.response.error.messages.join(', ') : error.message;
    throw new Error(`Failed to create Spreaker episode (Status: ${error.response?.status}): ${errorMessage}`);
  }
}

module.exports.syncEpisodesToSpreaker = syncEpisodesToSpreaker;
module.exports.getSpreakerPublishedEpisode = getSpreakerPublishedEpisode;
