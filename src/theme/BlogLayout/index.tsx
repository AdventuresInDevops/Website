import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';

import type {Props} from '@theme/BlogLayout';

export default function BlogLayout(props: Props): ReactNode {
  const {sidebar, toc, children, ...layoutProps} = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

  return (
    <Layout {...layoutProps}>
      <div className="container margin-vert--lg">
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <main style={{ maxWidth: '1000px'}}>
            {children}
          </main>
        </div>
      </div>
    </Layout>
  );
}
