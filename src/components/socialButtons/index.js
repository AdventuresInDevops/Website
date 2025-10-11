import React from 'react';
import clsx from 'clsx';

import Link from '@docusaurus/Link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faApple, faBluesky, faDiscord, faLinkedin, faSpotify, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { faRssSquare, faHouseSignal } from '@fortawesome/free-solid-svg-icons';
import CopyInput from './copyInput';

import styles from './styles.module.css';

const postHogSocialButtonTrackingIdCssClassName = 'user-event-social-buttons';

/**
 * The Apple connection must come first when the device is an Apple device, so figure that out and specify here it here.
 */
const isAppleDevice = () => {
  if (typeof window === 'undefined' || window.location.hostname === 'localhost') {
    return true;
  }
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  // iPad on iOS 13 detection
  || (typeof userAgent === 'string' && userAgent.includes('Mac') && typeof document?.ontouchend !== 'undefined');
};

// https://overcast.fm/podcasterinfo
const overcastUrl = 'https://overcast.fm/itunes1475784710';

export function SocialButtons(props) {
  // const { name, image, brandImg, link } = props;

  return (<>
    <div className={postHogSocialButtonTrackingIdCssClassName} style={props.style}>
      <a href="https://podcasts.apple.com/podcast/adventures-in-devops/id1475784710" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
        <div>
          <FontAwesomeIcon icon={faApple} size="3x" style={{ color: '#a2aaad' }} title="Subscribe on Apple Podcasts" />
        </div>
      </a>

      <a href="https://open.spotify.com/show/7h0KN1wSukqOmQVvMmAfan" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
        <div>
          <FontAwesomeIcon icon={faSpotify} size="3x" style={{ color: '#1ED760' }} title="Check out the episode on Spotify" />
        </div>
      </a>

      <a href="https://www.youtube.com/@AdventuresInDevOps" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
        <div>
          <FontAwesomeIcon icon={faYoutube} style={{ color: '#FF0033' }} size="3x" title="YouTube" />
        </div>
      </a>

      {(isAppleDevice() && <a href={overcastUrl} target="_blank" className={clsx('text-dark', styles.networkingLink)}>
        <div style={{ display: 'flex' }}>
          <OvercastImage />
        </div>
      </a>)}

      <a href="/docs/subscribe" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
        <div>
          <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Follow for new episodes on our RSS Feed" />
        </div>
      </a>
    </div>
  </>);
}


import SpotifyImage from './spotify.webp';
import AppleImage from './apple.svg';
import OvercastImage from './overcast.svg';
import YoutubeImage from './youtube.svg';
import AmazonImage from './amazon.webp';

export function SocialButtonsFull(props) {
  // const { name, image, brandImg, link } = props;

  const mergedStyles = Object.assign({ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }, props.style);

  return (<>
    <div style={mergedStyles} className={clsx(postHogSocialButtonTrackingIdCssClassName, styles.socialButtonsFull)} >
      <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('', styles.subscriptionButton)} to="https://podcasts.apple.com/podcast/adventures-in-devops/id1475784710">
          <AppleImage />
        </Link>
      </div>

      <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('', styles.subscriptionButton)} to="https://open.spotify.com/show/7h0KN1wSukqOmQVvMmAfan" style={{ }}>
          <img src={SpotifyImage} alt="Listen on Spotify" height="60px" />
        </Link>
      </div>

      {(isAppleDevice() && <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('button button--secondary', styles.subscriptionButton)} to={overcastUrl} style={{ width: '200px', height: '60px', backgroundColor: 'var(--ifm-color-gray-900)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#4a86e8', fill: '#4a86e8' }}>
            <OvercastImage /><span style={{ fontSize: '20px' }}>Overcast.fm</span>
          </div>
        </Link>
      </div>)}

      <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('', styles.subscriptionButton)} to="https://www.youtube.com/@AdventuresInDevOps">
          <YoutubeImage />
        </Link>
      </div>

      <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('', styles.subscriptionButton)} to="https://music.amazon.com/identity/who-is-listening?returnTo=https%3A%2F%2Fmusic.amazon.com%2Fpodcasts%2F8464ac22-2b3b-4ea5-8b04-a98473afd8aa%2Fadventures-in-devops">
          <img src={AmazonImage} alt="Listen on Amazon Music" height="60px" />
        </Link>
      </div>
    </div>
  </>);
}

export function RssFeedCopy(props) {
  return (<>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <CopyInput initialText="https://adventuresindevops.com/rss.xml" />
        <a href="https://adventuresindevops.com/episodes/rss.xml" target="_blank" className={clsx('text-dark', styles.networkingLink)} style={{ marginTop: '0.25rem', marginLeft: '1rem' }}>
          <div>
            <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Open RSS Feed" />
          </div>
        </a>
      </div>
  </>)
}


export function ConnectWithUsButtons(props) {
  // const { name, image, brandImg, link } = props;

  return (<>
    <div className={postHogSocialButtonTrackingIdCssClassName} style={props.style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', width: 'min(100vw, 300px)' }}>
        <a href="https://adventuresindevops.com/join" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
          <div>
            <FontAwesomeIcon icon={faDiscord} size="3x" style={{ color: '#5865F2' }} title="Connect on discord" />
          </div>
        </a>

        <a href="https://www.linkedin.com/showcase/devops-podcast" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
          <FontAwesomeIcon icon={faLinkedin} style={{ color: '#0077B5' }} size="3x" />
        </a>

        <a href="https://bsky.app/profile/adventuresindevops.bsky.social" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
          <div>
            <FontAwesomeIcon icon={faBluesky} size="3x" style={{ color: '#1185FE' }} title="Chat with us on BlueSky" />
          </div>
        </a>
      </div>
    </div>
  </>);
}
