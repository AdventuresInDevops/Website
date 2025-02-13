import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.scss';

import SocialButtons from '../components/socialButtons';

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
                <div style={{ display: 'flex', justifyContent: 'space-around', width: '400px' }}>
                  <SocialButtons />
                </div>
              </div>
            </div>

          </div>
        </div>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/episodes">
            <span className={styles.desktop}>Listen to the latest Episode ⏩</span>
            <span className={styles.mobile}>Listen Now ⏩</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
    </Layout>
  );
}
