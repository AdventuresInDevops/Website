import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.scss';

import { SocialButtons } from '../components/socialButtons';
import SurveyBroadcast from '../components/surveyBroadcast';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRssSquare } from '@fortawesome/free-solid-svg-icons';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)} style={{ height: '600px' }}>
      <div className="container">
        <div className={styles.container}>
          <div className={styles.desktop} style={{ marginRight: '3em' }}>
            <img src={siteConfig.themeConfig.navbar.logo.src}></img>
          </div>
          <div>
            <Heading as="h1" className="hero__title">
              {siteConfig.title}
            </Heading>
            
            <h2 className={styles.desktop} style={{ fontSize: '2.25rem'}}>Will Button, Warren Parad</h2>

            <div className={styles.desktop}>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <SocialButtons style={{ display: 'flex', justifyContent: 'space-around', width: '500px' }} />
              </div>
            </div>

          </div>
        </div>
        <p className={clsx('hero__subtitle', styles.desktop)}>{siteConfig.tagline}</p>
        <div className={styles.buttons} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="button button--secondary button--lg" to="/episodes" style={{ marginRight: '10px', marginBottom: '10px' }}>
            <span className={styles.desktop}>Listen to the latest Episode ▶️</span>
            <span className={styles.mobile}>Listen Now ▶️</span>
          </Link>

          <Link className="button button--secondary button--lg" to="/docs/subscribe" style={{ marginRight: '10px', marginBottom: '10px' }}>
            <span className={styles.desktop}>Subscribe in your app <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="lg" title="Follow for new episodes on our RSS Feed" /></span>
            <span className={styles.mobile}>Subscribe <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="lg" title="Follow for new episodes on our RSS Feed" /></span>
          </Link>
        </div>

        <div className={styles.mobile}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <SocialButtons style={{ display: 'flex', justifyContent: 'space-around', maxWidth: '100%', height: '130px', flexWrap: 'wrap' }} />
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
      <SurveyBroadcast />
      <HomepageHeader />
    </Layout>
  );
}
