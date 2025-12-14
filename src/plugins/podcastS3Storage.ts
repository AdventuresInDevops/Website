/* eslint-disable no-console */
const { parseStringPromise: parseXml } = require('xml2js');
const fs = require('fs-extra');

import type { LoadContext, Plugin } from '@docusaurus/types';

import { getCurrentlySyncedS3EpisodeSlugs } from "../../episode-release-generator/publisher/sync";

export default async function getCurrentlySyncedS3Episodes(context: LoadContext): Plugin {
  return {
    name: 'podcastS3Storage',

    async allContentLoaded({ allContent, actions }) {
      const { setGlobalData, createData } = actions;

      /* RSS */
      const response = await fetch('https://adventuresindevops.com/rss.xml');
      const rssData = await response.text();
      const xmlObject = await parseXml(rssData, { explicitArray: false });

      const rssFeedStorageData = xmlObject.rss.channel.item.map(i => ({
        episodeSlug: i.link.split('/').slice(-1)[0],
        episodeNumber: i['itunes:episode']
      })).reduce((acc, e) => ({ ...acc, [e.episodeSlug]: e }), {});

      // Local RSS
      const localRssData = await fs.readFile('./episode-release-generator/base-rss.xml');
      const localXmlObject = await parseXml(localRssData, { explicitArray: false });

      const localRssFeedStorageData = localXmlObject.rss.channel.item.map(i => ({
        episodeSlug: i.link.split('/').slice(-1)[0],
        episodeNumber: i['itunes:episode']
      })).reduce((acc, e) => ({ ...acc, [e.episodeSlug]: e }), {});

      try {
        console.log(`[Podcast S3 Storage] Fetching object list`);
        const episodeSlugs = await getCurrentlySyncedS3EpisodeSlugs();

        const episodeStorageList = episodeSlugs.map(e => ({
          episodeNumber: e.split('-')[0],
          partialSlug: e.split('-').slice(1).join('-')
        }));

        const episodeStorageData = episodeStorageList.reduce((acc, e) => ({ ...acc, [e.partialSlug]: e }), {});

        setGlobalData({ episodeStorageData, rssFeedStorageData, localRssFeedStorageData });
      } catch (err) {
        if (err.name === 'CredentialsProviderError' && !process.env.CI) {
          console.error('[S3 Fetcher] No credentials set to access AWS locally, returning an empty list.', err.message, err.code, err.name);
          setGlobalData({ episodeStorageData: {}, rssFeedStorageData, localRssFeedStorageData });
          return;
        }
        console.error('[S3 Fetcher] Error fetching from S3:', err.message, err.code, err.name);
        throw err;
      }
    },
  };
}
