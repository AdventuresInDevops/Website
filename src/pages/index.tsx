import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Head from '@docusaurus/Head';

import styles from './index.module.scss';

import { SocialButtons } from '../components/socialButtons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRssSquare } from '@fortawesome/free-solid-svg-icons';


import { SocialButtonsFull, ConnectWithUsButtons } from '@site/src/components/socialButtons';
import RecommendedEpisode from '@site/src/components/recommendedEpisode';

import TargetSubscribeComponent from '@site/src/components/targetSubscribeComponent';


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
      webFeed: `${siteUrl}/rss.xml`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Adventures in DevOps',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/episodes?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
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
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.container}>
          <TargetSubscribeComponent>
            <RecommendedEpisode slug="261-creative-practical-unconventional-engineering" />
            <RecommendedEpisode slug="managers-of-agents-ai-strategy" />
            <RecommendedEpisode slug="chosing-the-best-database-for-ml" />
          </TargetSubscribeComponent>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
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
