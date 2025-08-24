import React from 'react';
import clsx from 'clsx';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faApple, faBluesky, faDiscord, faLinkedin, faSpotify, faYoutube } from '@fortawesome/free-brands-svg-icons'
import { faRssSquare } from '@fortawesome/free-solid-svg-icons';

import styles from './styles.module.css';

export default function SocialButtons(props) {
  // const { name, image, brandImg, link } = props;

  return (<>
    <a href="https://www.linkedin.com/showcase/devops-podcast" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
      <FontAwesomeIcon icon={faLinkedin} style={{ color: '#0077B5' }} size="3x" />
    </a>

    <a href="https://podcasts.apple.com/us/podcast/adventures-in-devops/id1475784710" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
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

    <a href="https://adventuresindevops.com/episodes/rss.xml" target="_blank" className={clsx('text-dark', styles.networkingLink)}>
      <div>
        <FontAwesomeIcon icon={faRssSquare} style={{ color: 'orange' }} size="3x" title="Follow for new episodes on our RSS Feed" />
      </div>
    </a>
  </>);
}
