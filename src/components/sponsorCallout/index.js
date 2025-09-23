import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

export default function GuestCalloutComponent(props) {
  const { name, image, link } = props;

  return (<>
    <div>
      <div className={clsx(styles.authorCalloutWrapper)} style={{ marginBottom: '1rem'}}>
        <div style={{ borderRadius: '10px', maxWidth: '400px' }} className={clsx(styles.authorCalloutInnerWrapper)}>

          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}>
            <a href={link}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img height="60px" src={image}></img>
              </div>
            </a>

            <div style={{ marginTop: '-0.5rem', marginLeft: '1rem', fontSize: '16px' }}>Episode Sponsor:<br></br><a href={link}>{name}</a></div>
          </div>
        </div>
      </div>
    </div>
  </>);
}
