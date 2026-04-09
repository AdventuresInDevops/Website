/* eslint-disable no-console */

const axios = require('axios');
const { AuthressClient } = require('@authress/sdk');
const githubAction = require('@actions/core');
const { parseStringPromise: parseXml } = require('xml2js');
const { getAudioBlobFromEpisode, getEpisodesFromDirectory } = require('./sync');
const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');

// https://www.spreaker.com/cms/statistics/downloads/shows/6102036
const SPREAKER_SHOW_ID = "6102036";

let cachedAccessToken = null;
async function getAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  let token;
  if (process.env.CI) {
    try {
      token = await githubAction.getIDToken('https://api.authress.io');
    } catch (error) {
      console.error('Failed to get spreaker API token from github', error);
      throw error;
    }
  } else {
    try {
      const encryptedSpreakerKey = 'AQICAHilX9Cp3Kcclg6eCHZRhHNeNN4DUWE5Yt7XLB+0vnFDIAElf2NnFntdmkujMforAWQxAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDFyUP476Ygsz51UFxQIBEIBDg+/l9+YwBgII7zuBJj5KD1WGY/mE41Ll3d6M3UNBtc15qE+DR2B1bkRY6HbsJQxJBx8G6XlMhJAiYzp57I2mMDexLw==';
      const kmsClient = new KMSClient({ region: 'us-west-1' });
      const decryptResult = await kmsClient.send(new DecryptCommand({ CiphertextBlob: Buffer.from(encryptedSpreakerKey, 'base64') }));
      token = Buffer.from(decryptResult.Plaintext).toString('utf8');
    } catch (error) {
      console.error('Failed to get spreaker API token from AWS KMS', error);
      throw error;
    }
  }

  try {
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

  const audioBlob = await getAudioBlobFromEpisode(episode);
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
