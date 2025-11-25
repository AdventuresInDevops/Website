import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { SocialButtonsFull } from '../socialButtons';
import clsx from 'clsx';

import styles from './styles.module.scss';

export default function TargetSubscribeComponent({ children }) {
  const { siteConfig } = useDocusaurusContext();

  return (<>
    <div style={{ maxWidth: "1000px", margin: 'auto', marginTop: '2em' }}>

      <div>

        <div style={{ display: 'flex' }} className={clsx(styles.wrapper)}>
          <img style={{ marginRight: '2em' }} src={siteConfig.themeConfig.image}></img>


          <div style={{ marginTop: '1em' }}>
            <h2 className="">DevOps at the intersection of business and technology</h2>

            <span> Join us in listening to the experienced experts discuss cutting edge challenges in the world of DevOps. From applying the mindset at your company, to career growth and leadership challenges within engineering teams, and avoiding the common antipatterns. Every episode you'll meet a new industry veteran guest with their own unique story.</span>

            <br></br><br></br>
            <div style={{ display: 'flex', justifyContent: 'start' }}>
              <strong style={{ color: 'unset' }}>New episode every Friday!</strong>
            </div>
          </div>
        </div>


        <h2 style={{ marginTop: '1em', fontSize: '3em' }}>Subscribe on</h2>

        <SocialButtonsFull />

        <h2 style={{ marginTop: '1em', fontSize: '3em' }}>Recommended Episodes</h2>


        {children}
      </div>
    </div>
  </>);
}