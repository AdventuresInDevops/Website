import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import { DateTime } from 'luxon';

import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

import {BlogPostProvider} from '@docusaurus/plugin-content-blog/client';
import type {Props as BlogPostItemsProps} from '@theme/BlogPostItems';
import MDXContent from '@theme/MDXContent';
import type {BlogPostItemProps} from '@theme/BlogPostItem/Content';

import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';

import styles from './styles.module.css';

export default function BlogPostItems({
  items
}: BlogPostItemsProps): JSX.Element {
  const navigateToLink = (link: string) => {
    window.location.assign(link);
  };

  return (
    <>
      {items.map(({content: BlogPostContent}) => {
        const blogPost = BlogPostContent.metadata;
        console.log();
        const date = DateTime.fromISO(blogPost.date).toLocaleString(DateTime.DATE_MED);
        return (
          <div className={styles.hoverHighlight} style={{ 'display': 'flex', borderRadius: '4px' }} onClick={() => navigateToLink(blogPost.permalink)}>
            <div style={{ 'display': 'flex', minWidth: '200px', height: '210px' }}>
              <div style={{ width: '100%', backgroundImage: `url(${BlogPostContent.assets.image})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: '1/1' }}>
                {/* <img style={{ height: '210px', width: '200px', borderRadius: '4px 0px 0px 4px' }} src={}></img> */}
              </div>
            </div>
            <div style={{ padding: '1rem 1rem 1rem 2rem' }}>
              <h2 className={styles.title} style={{ marginBottom: '0.1rem' }}><a style={{ textDecoration: 'none' }} href={blogPost.permalink}>{blogPost.title}</a></h2>
              <small>{date}</small>
              <div className={styles.description}>{blogPost.description}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}