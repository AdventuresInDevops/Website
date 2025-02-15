import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import MDXContent from '@theme/MDXContent';
import type {Props} from '@theme/BlogPostItem/Content';

import styles from './styles.module.scss';

export default function BlogPostItemContent({
  children,
  className,
}: Props): ReactNode {
  const {isBlogPostPage, ...blogPost} = useBlogPost();
  const thing = JSON.stringify(blogPost, null, 2);

  const youtubeVideoId = blogPost.frontMatter.custom_youtube_embed_url?.split('/').slice(-1)[0];
  const youtubeVideoEmbedUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null;
  return (
    <div
      // This ID is used for the feed generation to locate the main content
      id={isBlogPostPage ? blogPostContainerID : undefined}
      className={clsx('markdown', className)}>

      {youtubeVideoEmbedUrl && (<div className={styles.youtubeWrapper}>
        <iframe style={{ borderRadius: '10px' }} width="100%" height="100%" src={youtubeVideoEmbedUrl} title={blogPost.metadata.title}
frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>)}

      <MDXContent>{children}</MDXContent>
    </div>
  );
}
