import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

export default function GuestCalloutComponent(props) {
  const { name, image, link, tagline } = props;

  return (<>
    <a href={link} className={clsx(styles.wrapper)} style={{ flexGrow: '1' }}>
      <div className={clsx(styles.authorCalloutWrapper)} style={{ marginBottom: '1rem'}}>
        <div style={{ borderRadius: '10px', maxWidth: 'min(100%, 400px)', width: '100%' }} className={clsx(styles.authorCalloutInnerWrapper)}>

          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img height="60px" src={image}></img>
              </div>
            </div>

            <div style={{ marginLeft: '1rem', fontSize: '16px' }}><span className={clsx(styles.removeLinkStyling)}>Episode Sponsor:</span>
              <br></br>
              <span>
                <a href={link}>{name}</a>
                <span className={clsx(styles.removeLinkStyling)}> - {tagline}</span></span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </>);
}
