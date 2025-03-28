import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import { DateTime } from 'luxon';

import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

import {BlogPostProvider} from '@docusaurus/plugin-content-blog/client';
import type {Props as BlogPostItemsProps} from '@theme/BlogPostItems';
import MDXContent from '@theme/MDXContent';
import type {BlogPostItemProps} from '@theme/BlogPostItem/Content';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import the FontAwesomeIcon component.


import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';

import styles from './styles.module.scss';
import SurveyBroadcast from '@site/src/components/surveyBroadcast';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function BlogPostItems({
  items
}: BlogPostItemsProps): JSX.Element {
  const navigateToLink = (link: string) => {
    window.location.assign(link);
  };

  const result = useDocusaurusContext();
  const docusaurusConfigPostsPerPageCount = result.siteConfig.presets[0][1].blog.postsPerPage;

  return (
    <div className={styles.itemsListWrapper}>
      <SurveyBroadcast />
      {items.map(({content: BlogPostContent}) => {
        const blogPost = BlogPostContent.metadata;

        const date = DateTime.fromISO(blogPost.date).toLocaleString(DateTime.DATE_MED);
        return (
          <div key={blogPost.permalink} className={styles.hoverHighlight} style={{ 'display': 'flex', borderRadius: '4px' }} onClick={() => navigateToLink(blogPost.permalink)}>
            <div style={{ 'display': 'flex', minWidth: '200px', height: '210px' }}>
              <div style={{ borderRadius: '4px 0 0 4px', width: '100%', backgroundImage: `url(${BlogPostContent.assets.image})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: '1/1' }}>
                <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesomeIcon icon="fa-regular fa-circle-play" className={styles.playIcon} size="7x" />
                </div>
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
      {items.length < docusaurusConfigPostsPerPageCount &&
        (<div style={{ minWidth: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
          <div className={styles.hoverHighlight} style={{ height: '60px', minWidth: '300px', 'display': 'flex', borderRadius: '4px' }} onClick={() => navigateToLink('https://www.youtube.com/playlist?list=PLJesql-aSfX4-ySQL2GKoG585gkp7HuCf')}>
            <div style={{ padding: '1rem 1rem 1rem 2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <h2 className={styles.title} style={{ marginBottom: '0.1rem', marginRight: '0.5rem' }}>See More Episodes</h2> <FontAwesomeIcon icon="fa-solid fa-up-right-from-square" />
              </span>
            </div>
          </div>
        </div>)
      }
    </div>
  );
}