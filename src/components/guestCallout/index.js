import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

export default function GuestCalloutComponent(props) {
  const { name, image, brandImg, link, children: brandImgComponent } = props;

  return (<>
    <a href={link} className={clsx(styles.wrapper)} style={{ flexGrow: '1' }}>
      <div className={clsx(styles.authorCalloutWrapper)} style={{ marginBottom: '1rem'}}>
        <div style={{ borderRadius: '10px', maxWidth: 'min(400px, 100%)', width: '100%' }} className={clsx(styles.authorCalloutInnerWrapper)}>

          <div style={{ padding: '0.5rem 0 0 1rem', display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {brandImg && <img height="50px" width="50px" src={brandImg}></img>}
                <div style={{ height: '50px' }}>
                  {brandImgComponent}
                </div>
              </div>
              <div style={{ display: 'flex-inline', alignItems: 'center', marginLeft: '1.5rem', marginTop: '-1.5rem' }}>
                <img height="60px" width="60px" style={{ borderRadius: '100%' }} src={image}></img>
              </div>
            </div>

            <div style={{ marginLeft: '1rem', fontSize: '16px', paddingBottom: '0.25rem' }}><span className={clsx(styles.removeLinkStyling)}>Guest:</span>
              <br></br>
              <span>{name}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  </>);
}
