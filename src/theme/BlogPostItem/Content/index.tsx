import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import MDXContent from '@theme/MDXContent';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {Props} from '@theme/BlogPostItem/Content';

import { SocialButtons } from '@site/src/components/socialButtons';

import styles from './styles.module.scss';

export default function BlogPostItemContent({
  children,
  className,
  toc
}: Props): ReactNode {
  const {isBlogPostPage, ...blogPost} = useBlogPost();
  const displaySocialButtons = true;

  const thing = JSON.stringify(blogPost, null, 2);

  const youtubeVideoId = blogPost.frontMatter.custom_youtube_embed_url?.split('/').slice(-1)[0];
  const youtubeVideoEmbedUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null;

  const { episodeStorageData } = usePluginData('podcastS3Storage');

  const episodeSlug = blogPost.metadata.permalink.split('/').slice(-1)[0];
  const transcriptLinkUrl = `https://links.adventuresindevops.com/storage/episodes/${episodeStorageData[episodeSlug]?.episodeNumber || 'EpisodeNumberResolutionFailed'}-${episodeSlug}/transcript.txt`;

  return (
    <div
      // This ID is used for the feed generation to locate the main content
      id={isBlogPostPage ? blogPostContainerID : undefined}
      className={clsx('markdown', className)}>

      {youtubeVideoEmbedUrl && (<div className={styles.youtubeWrapper}>
        <iframe style={{ borderRadius: '10px' }} width="100%" height="100%" src={youtubeVideoEmbedUrl} title={blogPost.metadata.title}
frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>)}

      {displaySocialButtons && (
        <div className={styles.socialButtonsWrapperMobile}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '3rem' }}>
            <SocialButtons style={{ maxWidth: '100%', width: 'min(600px, 90vw)', height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }} />
          </div>
        </div>
      )}

      <p>
        <small><em>
          <a href={transcriptLinkUrl}>Transcript available</a>
        </em></small>
      </p>

      <MDXContent>{children}</MDXContent>
    </div>
  );
}
