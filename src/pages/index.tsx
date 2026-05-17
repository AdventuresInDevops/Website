import { JSX } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';

import RecommendedEpisode from '@site/src/components/recommendedEpisode';
import TargetSubscribeComponent from '@site/src/components/targetSubscribeComponent';

import styles from './index.module.scss';

function HomepageJsonLd(): JSX.Element {
  const siteUrl = 'https://adventuresindevops.com';
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'PodcastSeries',
      name: 'Adventures in DevOps',
      description: 'DevOps at the intersection of business and technology. Weekly conversations with engineers, architects, and technology leaders.',
      url: siteUrl,
      image: `${siteUrl}/img/logo.jpg`,
      webFeed: `${siteUrl}/rss.xml`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Adventures in DevOps',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/episodes?q={search_term_string}` },
        'query-input': 'required name=search_term_string'
      }
    }
  ];
  return (
    <Head>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Head>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.container}>
          <TargetSubscribeComponent>
            <RecommendedEpisode slug="272-human-value-versus-ai-generated-legacy-code" />
            <RecommendedEpisode slug="261-creative-practical-unconventional-engineering" />
            <RecommendedEpisode slug="managers-of-agents-ai-strategy" />
          </TargetSubscribeComponent>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    // Title and Description show up in the meta
    <Layout
      // Don't pass title because the site title is already included
      // title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageJsonLd />
      <HomepageHeader />
    </Layout>
  );
}
