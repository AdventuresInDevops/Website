import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

export default function StylizedButtonComponent(props) {
  const { children, href, target } = props;

  function navigateToLink() {
    window.open(href, '_blank');
  }

  return (<>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {!target && <button className={clsx(styles.button)} onClick={navigateToLink}>
        <div style={{ fontSize: '36px' }}>
          { children }
        </div>
      </button>}

      {target && <Link className={clsx(styles.link)} href={href} target={target}>
        <div style={{ fontSize: '36px' }}>
          { children }
        </div>
      </Link>}
    </div>
  </>);
}
