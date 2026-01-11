import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import { DateTime } from 'luxon';

import {blogPostContainerID} from '@docusaurus/utils-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';

import {BlogPostProvider} from '@docusaurus/plugin-content-blog/client';
import type {Props as BlogPostItemsProps} from '@theme/BlogPostItems';
import MDXContent from '@theme/MDXContent';
import type {BlogPostItemProps} from '@theme/BlogPostItem/Content';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {usePluginData} from '@docusaurus/useGlobalData';

import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';

import styles from './styles.module.scss';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const postHogSocialButtonTrackingIdCssClassName = 'user-event-episode';

export default function BlogPostItems({
  items
}: BlogPostItemsProps): JSX.Element {
  const isBrowser = useIsBrowser();

  const navigateToLink = (link: string) => {
    if (isBrowser) {
      window.location.assign(link);
    }
  };

  const { siteConfig } = useDocusaurusContext();
  const { isDevelopment } = siteConfig.customFields;
  const docusaurusConfigPostsPerPageCount = siteConfig.presets[0][1].blog.postsPerPage;
  const { rssFeedStorageData, localRssFeedStorageData } = usePluginData('podcastS3Storage');

  return (
    <div className={styles.itemsListWrapper}>
      {items.map(({content: BlogPostContent}) => {
        const blogPost = BlogPostContent.metadata;

        const date = DateTime.fromISO(blogPost.date);

        const episodeSlug = blogPost.permalink.split('/').slice(-1)[0];
        const episodeNumber = rssFeedStorageData[episodeSlug]?.episodeNumber;
        
        let blogPostImage;

        const episodeNumberMatchFromSlug = episodeSlug.match(/^(\d+)-[^\d]/)?.[1];
        if (!isDevelopment && episodeNumberMatchFromSlug) {
          blogPostImage = `https://links.adventuresindevops.com/storage/episodes/${episodeNumberMatchFromSlug}/post.webp`;
        }

        if (!blogPostImage && episodeNumber) {
          blogPostImage = `https://links.adventuresindevops.com/storage/episodes/${episodeNumber}/post.webp`;
        }
        
        if (!blogPostImage && !episodeNumber && localRssFeedStorageData[episodeSlug]) {
          blogPostImage = BlogPostContent.assets.image;
        }

        const isArticle = Object.hasOwn(blogPost.frontMatter, 'episode') && !blogPost.frontMatter.episode;
        if (!blogPostImage && DateTime.utc() < date && isDevelopment) {
          blogPostImage = BlogPostContent.assets.image || '/img/logo.jpg';
        }

        if (DateTime.utc().plus({ days: 1 }) < date && (!isDevelopment || !blogPostImage || !BlogPostContent.frontMatter.title)) {
          return <span id={blogPost.permalink} key={blogPost.permalink}></span>;
        }

        if (!blogPostImage && !isArticle) {
          throw `[BlogPostItems] List cannot include an episode that is not currently published: ${episodeSlug} ${date} - ${JSON.stringify(blogPost)}`;
        }

        const formattedDate = date.toLocaleString(DateTime.DATE_MED);
        return (
          <Link key={blogPost.permalink} className={clsx(postHogSocialButtonTrackingIdCssClassName, styles.hoverHighlight)} style={{ borderRadius: '10px', textDecoration: 'none', color: 'unset' }} to={blogPost.permalink}>
            <div style={{ 'display': 'flex' }} className={styles.imageWrapper}>
              <div style={{ width: '100%', backgroundImage: `url(${blogPostImage})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: '3/2' }}>
                <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <FontAwesomeIcon icon="fa-regular fa-circle-play" className={styles.playIcon} size="4x" style={{ maxHeight: '80px', opacity: 0.6 }} />
                </div>
              </div>
            </div>
            <div className={styles.episodeTitleBlock}>
              <h2 className={styles.title} style={{ marginBottom: '0.1rem' }}>{blogPost.title}</h2>
              <small>{formattedDate}</small>
              <div className={styles.description}>{blogPost.description}</div>
            </div>
          </Link>
        );
      })}
      {items.length < docusaurusConfigPostsPerPageCount &&
        (<div style={{ minWidth: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
          <div className={styles.hoverHighlight} style={{ minWidth: '300px', borderRadius: '4px' }} onClick={() => navigateToLink('https://www.youtube.com/playlist?list=PLJesql-aSfX4-ySQL2GKoG585gkp7HuCf')}>
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
