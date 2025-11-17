import React from 'react';
import {usePluginData} from '@docusaurus/useGlobalData';
import clsx from 'clsx';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from '@docusaurus/Link';

// Import the generated images module
import blogImages from '@site/.docusaurus/recommendedEpisodesPlugin/default/blog-images';

import styles from './styles.module.scss';

const postHogSocialButtonTrackingIdCssClassName = 'user-event-recommended-episode';

export default function RecommendedEpisodeComponent({ slug }) {
  const { blogPosts } = usePluginData('recommendedEpisodesPlugin');
  
  const blogPost = blogPosts.find(p => p.id.includes(slug));
  if (!blogPost) {
    throw `[RecommendEpisode] No post found with slug: ${slug}`;
  }

  const date = DateTime.fromISO(blogPost.date).toLocaleString(DateTime.DATE_MED);
  const blogPostImage = blogImages[blogPost.id];
  return (
    <Link key={blogPost.permalink}
      className={clsx(postHogSocialButtonTrackingIdCssClassName, styles.hoverHighlight)} style={{ borderRadius: '10px', textDecoration: 'none', color: 'unset' }}
      to={blogPost.permalink}>
      <div style={{ 'display': 'flex' }} className={styles.imageWrapper}>
        <div style={{ padding: '10px', width: '100%',
          backgroundImage: `url(${blogPostImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          aspectRatio: '3/2' }}>
        </div>
      </div>
      <div className={styles.episodeTitleBlock}>
        <h2 className={styles.title} style={{ marginBottom: '0.1rem' }}>{blogPost.title}</h2>
        {/* <small>{date}</small> */}
        <div className={styles.description}>{blogPost.description}</div>
      </div>
    </Link>
  );
}