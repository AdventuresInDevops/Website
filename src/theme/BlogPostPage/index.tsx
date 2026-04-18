import React, { type ReactNode } from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type BlogPostPageType from '@theme/BlogPostPage';
import type { WrapperProps } from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogPostPageType>;

export default function BlogPostPageWrapper(props: Props): ReactNode {
  const { metadata, frontMatter } = props.content as any;
  const siteUrl = 'https://adventuresindevops.com';

  const episodeSlug = (metadata.permalink as string).split('/').slice(-1)[0];
  const episodeNumber = (frontMatter as any).episode_number
    ?? episodeSlug.match(/^(\d+)-[^\d]/)?.[1];
  const youtubeId = (frontMatter as any).custom_youtube_embed_url?.split('/').slice(-1)[0];

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: metadata.title,
    description: metadata.description || '',
    url: `${siteUrl}${metadata.permalink}`,
    datePublished: metadata.date,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'Adventures in DevOps',
      url: siteUrl,
    },
  };

  if (episodeNumber) {
    jsonLd.episodeNumber = parseInt(String(episodeNumber), 10);
  }

  if (youtubeId) {
    jsonLd.associatedMedia = {
      '@type': 'VideoObject',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      url: `https://youtu.be/${youtubeId}`,
    };
  }

  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <BlogPostPage {...props} />
    </>
  );
}
