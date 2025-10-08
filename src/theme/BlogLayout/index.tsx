import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';

import type {Props} from '@theme/BlogLayout';
import { SocialButtons } from '@site/src/components/socialButtons';

import styles from './styles.module.css';

export default function BlogLayout(props: Props): ReactNode {
  const {sidebar, toc, children, ...layoutProps} = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

  const tocCouldBeDisplayedOnPage = Object.hasOwn(props, 'toc');

  return (
    <Layout {...layoutProps}>
      <div className="container" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {(<div className={styles.socialButtonsWrapper} style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'fixed', right: '30px', top: '350px' }}>
            <SocialButtons style={{ maxWidth: '50px', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} />
          </div>)}

          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <main style={{ maxWidth: '1000px'}}>
              {children}
            </main>
          </div>
        </div>

        {!tocCouldBeDisplayedOnPage && (
          <div className={styles.socialButtonsWrapperMobile}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '3rem' }}>
              <SocialButtons style={{ maxWidth: '100%', width: '500px', height: '60px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
