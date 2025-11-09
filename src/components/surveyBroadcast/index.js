import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';

// import styles from './styles.module.css';

export default function SurveyBroadcast(props) {
  return (
    <div style={{ margin: '2rem 0 0.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ boxShadow: "0 0 5px 0.1px var(--secondary)", maxWidth: '80%' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '2rem' }}>
            <h3 style={{ color: 'unset' }}>The Adventures In DevOps Community <Link to="/survey">Survey</Link> is out! Take it and grab a chance to win one of our AWS Credit vouchers.</h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Link className="button button--primary button--lg" to="/survey">
                <span>To the Survey</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
