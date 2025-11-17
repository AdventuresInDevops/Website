/* eslint-disable no-console */

import type { LoadContext, Plugin } from '@docusaurus/types';

import { getCurrentlySyncedS3EpisodeSlugs } from "../../episode-release-generator/publisher/sync";

export default async function getCurrentlySyncedS3Episodes(context: LoadContext): Plugin {
  return {
    name: 'podcastS3Storage',

    async allContentLoaded({ allContent, actions }) {
      const { setGlobalData, createData } = actions;

      try {
        console.log(`[Podcast S3 Storage] Fetching object list`);
        const episodeSlugs = await getCurrentlySyncedS3EpisodeSlugs();

        const episodeStorageList = episodeSlugs.map(e => ({
          episodeNumber: e.split('-')[0],
          slug: e.split('-').slice(1).join('-')
        }));

        const episodeStorageData = episodeStorageList.reduce((acc, e) => ({ ...acc, [e.slug]: e }), {});

        setGlobalData({ episodeStorageData });
      } catch (err) {
        if (err.name === 'CredentialsProviderError' && !process.env.CI) {
          console.error('[S3 Fetcher] No credentials set to access AWS locally, returning an empty list.', err.message, err.code, err.name);
          setGlobalData({ episodeStorageData: {} });
          return;
        }
        console.error('[S3 Fetcher] Error fetching from S3:', err.message, err.code, err.name);
        throw err;
      }
    },
  };
}
