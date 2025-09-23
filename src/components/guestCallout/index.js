import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

export default function GuestCalloutComponent(props) {
  const { name, image, brandImg, link } = props;

  return (<>
    <div style={{ flexGrow: '1' }}>
      <div className={clsx(styles.authorCalloutWrapper)} style={{ marginBottom: '1rem'}}>
        <div style={{ borderRadius: '10px', maxWidth: 'min(400px, 100%)', width: '100%' }} className={clsx(styles.authorCalloutInnerWrapper)}>

          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img height="40px" src={brandImg}></img>
              </div>
              <div style={{ display: 'flex-inline', alignItems: 'center', marginLeft: '1.25rem', marginTop: '-1.75rem' }}>
                <img height="40px" style={{ borderRadius: '100%' }} src={image}></img>
              </div>
            </div>

            <div style={{ marginLeft: '1rem', fontSize: '16px' }}>Guest:<br></br><a href={link}>{name}</a></div>
          </div>
        </div>
      </div>
    </div>
  </>);
}
