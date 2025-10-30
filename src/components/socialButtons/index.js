import React from 'react';
import clsx from 'clsx';
import MobileDetect from 'mobile-detect';

import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faApple, faBluesky, faDiscord, faLinkedin, faSpotify, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { faRssSquare, faHouseSignal } from '@fortawesome/free-solid-svg-icons';
// import CopyInput from './copyInput';

import styles from './styles.module.css';

const postHogSocialButtonTrackingIdCssClassName = 'user-event-social-buttons';

/**
 * The Apple connection must come first when the device is an Apple device, so figure that out and specify here it here.
 */
const isAppleDevice = () => {
  const isBrowser = useIsBrowser();
  if (!isBrowser) {
    return true;
  }
  if (typeof window === 'undefined' || window.location.hostname === 'localhost') {
    return true;
  }
  const userAgent = navigator?.userAgentData && JSON.stringify(navigator?.userAgentData) || navigator?.userAgent || navigator?.vendor || navigator?.opera;
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

const isMobileDevice = () => {
  const isBrowser = useIsBrowser();
  if (!isBrowser) {
    return true;
  }
  if (typeof window === 'undefined' || window.location.hostname === 'localhost') {
    return true;
  }

  const userAgent = navigator?.userAgentData && JSON.stringify(navigator?.userAgentData) || navigator?.userAgent || navigator?.vendor || navigator?.opera;
  return !!new MobileDetect(userAgent)?.mobile();
};

const rssFeedUrl = 'https://adventuresindevops.com/rss.xml';

// https://overcast.fm/podcasterinfo
const overcastUrl = 'https://overcast.fm/itunes1475784710';
// https://antennapod.org/documentation/podcasters-hosters/add-on-antennapod
const antennaPodUrlLink = `antennapod-subscribe://adventuresindevops.com/rss.xml`;

// https://support.pocketcasts.com/knowledge-base/linking-to-my-show/
// https://pocketcasts.com/podcast/adventures-in-devops/da0c7b70-9b69-0137-4053-0acc26574db2 (click share button)
const pocketCastsUrlLink = "https://pca.st/47E4";

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

      <Link to="/docs/subscribe" className={clsx('text-dark', styles.networkingLink)}>
        <div>
          <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Follow for new episodes on our RSS Feed" />
        </div>
      </Link>
    </div>
  </>);
}


import SpotifyImage from './spotify.webp';
import AppleImage from './apple.svg';
import OvercastImage from './overcast.svg';
import YoutubeImage from './youtube.svg';
import AmazonImage from './amazon.webp';
import AntennaPod from './antenna-pod.svg';
import PocketCasts from './pocketcasts.svg';
import copyTextToClipboard from './copyInput';

export function SocialButtonsFull(props) {
  const isBrowser = useIsBrowser();
  // const { name, image, brandImg, link } = props;

  const mergedStyles = Object.assign({ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }, props.style);

  async function copyRssToClipboard() {
    if (!isBrowser) {
      return;
    }

    await copyTextToClipboard(rssFeedUrl);
  };

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

      {(isMobileDevice() && <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('button button--secondary', styles.subscriptionButton)} to={antennaPodUrlLink} data-noBrokenLinkCheck
          style={{ width: '200px', height: '60px', backgroundColor: 'var(--ifm-color-gray-900)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#16d0ff', fill: '#16d0ff' }}>
            <AntennaPod /><span style={{ fontSize: '20px', marginLeft: '0.25rem' }}>AntennaPod</span>
          </div>
        </Link>
      </div>)}

      {(isMobileDevice() && <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('button button--secondary', styles.subscriptionButton)} to={pocketCastsUrlLink}
          style={{ width: '200px', height: '60px', backgroundColor: 'black', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#16d0ff', fill: '#16d0ff' }}>
            <PocketCasts />
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

      <div className={clsx('', styles.subscriptionWrapper)}>
        <Link className={clsx('button button--secondary', styles.subscriptionButton)} to="feed://adventuresindevops.com/rss.xml" style={{ width: '200px', height: '60px', backgroundColor: 'var(--ifm-color-gray-900)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'white', fill: 'white' }}>
            <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="2x" title="Open RSS Feed" /><span style={{ marginLeft: '0.5em', fontSize: '20px' }}>Open feed://</span>
          </div>
        </Link>
      </div>

      <div className={clsx('', styles.subscriptionWrapper)}>
       <Link className={clsx('button button--secondary', styles.subscriptionButton)} to={rssFeedUrl} style={{ width: '200px', height: '60px', backgroundColor: 'var(--ifm-color-gray-900)', border: 'none' }} onClick={copyRssToClipboard}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'white', fill: 'white' }}>
            <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="2x" title="Copy RSS url" /><span style={{ marginLeft: '0.5em', fontSize: '20px' }}>Copy RSS url</span>
          </div>
        </Link>
      </div>
    </div>
  </>);
}

// export function RssFeedCopy(props) {
//   return (<>
//       <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
//         <Link to="https://adventuresindevops.com/episodes/rss.xml" target="_blank" className={clsx('text-dark', styles.networkingLink)} style={{ marginTop: '0.25rem', marginLeft: '1rem' }}>
//           <div>
//             <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Open Podcast App" />
//           </div>
//         </Link>

//         <CopyInput copyText="https://adventuresindevops.com/rss.xml" displayText="https://adventuresindevops.com/rss.xml" />

//         <Link to="https://adventuresindevops.com/episodes/rss.xml" target="_blank" className={clsx('text-dark', styles.networkingLink)} style={{ marginTop: '0.25rem', marginLeft: '1rem' }}>
//           <div>
//             <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Open RSS Feed" />
//           </div>
//         </Link>
//       </div>
//   </>)
// }


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
