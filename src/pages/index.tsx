import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.scss';

import { SocialButtons } from '../components/socialButtons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRssSquare } from '@fortawesome/free-solid-svg-icons';


import { SocialButtonsFull, ConnectWithUsButtons } from '@site/src/components/socialButtons';
import RecommendedEpisode from '@site/src/components/recommendedEpisode';

import TargetSubscribeComponent from '@site/src/components/targetSubscribeComponent';


function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.container}>
          <div>
            <TargetSubscribeComponent>
              <RecommendedEpisode slug="managers-of-agents-ai-strategy" />
              <RecommendedEpisode slug="solving-incidents-with-one-time-ephemeral-runbooks" />
              <RecommendedEpisode slug="chosing-the-best-database-for-ml" />
            </TargetSubscribeComponent>
          </div>
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
      <HomepageHeader />
    </Layout>
  );
}
