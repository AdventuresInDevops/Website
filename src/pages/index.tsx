import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBluesky, faDiscord, faGithub, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons'

import styles from './index.module.css';
import { faRssSquare } from '@fortawesome/free-solid-svg-icons';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)} style={{ height: '600px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ marginRight: '3em' }}>
            <img src={siteConfig.themeConfig.navbar.logo.src}></img>
          </div>
          <div>
            <Heading as="h1" className="hero__title">
              {siteConfig.title}
            </Heading>
            
            <h2 style={{ fontSize: '2.25rem'}}>Will Button, Warren Parad</h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', width: '400px' }}>
                <a href="https://www.linkedin.com/showcase/devops-podcast" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
                  <div>
                  <FontAwesomeIcon icon={faLinkedin} style={{ color: '#0077B5' }} size="3x" />
                  </div>
                </a>

                <a href="https://adventuresindevops.com/join" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
                  <div>
                    <FontAwesomeIcon icon={faDiscord} size="3x" style={{ color: '#5865F2' }} title="Connect on discord" />
                  </div>
                </a>

                <a href="https://bsky.app/profile/adventuresindevops.bsky.social" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
                  <div>
                    <FontAwesomeIcon icon={faBluesky} size="3x" style={{ color: '#1185FE' }} title="Chat with us on BlueSky" />
                  </div>
                </a>

                <a href="https://www.youtube.com/@AdventuresInDevOps" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
                  <div>
                  <FontAwesomeIcon icon={faYoutube} style={{ color: '#FF0033' }} size="3x" title="YouTube" />
                  </div>
                </a>

                <a href="https://adventuresindevops.com/episodes/rss.xml" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
                  <div>
                    <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Follow for new episodes on our RSS Feed" />
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/episodes">
            Listen to the latest Episode ⏩
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
