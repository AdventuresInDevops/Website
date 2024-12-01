import React from 'react';
import clsx from 'clsx';

import Styles from './styles.module.css';

export default function GuestCalloutComponent(props) {
  const { name, image, brandImg, link } = props;

  return (<>
    <div>
      <div className={clsx(Styles.authorCalloutWrapper)} style={{ marginBottom: '1rem'}}>
        <div style={{ borderRadius: '10px', maxWidth: '400px' }} className={clsx(Styles.authorCalloutInnerWrapper)}>

          <div style={{ padding: '1rem 1rem 0.25rem', display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img height="40px" src={brandImg}></img>
              </div>
              <div style={{ display: 'flex-inline', alignItems: 'center', marginLeft: '1.25rem', marginTop: '-1.75rem' }}>
                <img height="40px" style={{ borderRadius: '100%' }} src={image}></img>
              </div>
            </div>

            <div style={{ marginTop: '-0.5rem', marginLeft: '1rem', fontSize: '16px' }}>Guest:<br></br><a href={link}>{name}</a></div>
          </div>
        </div>
      </div>
    </div>
  </>);
}
