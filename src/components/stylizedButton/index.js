import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

export default function StylizedButtonComponent(props) {
  const { children, href } = props;

  function navigateToLink() {
    window.open(href, '_blank');
  }

  return (<>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button className={clsx(styles.button)} onClick={navigateToLink}>
        <div style={{ fontSize: '36px' }}>
          { children }
        </div>
      </button>
    </div>
  </>);
}
