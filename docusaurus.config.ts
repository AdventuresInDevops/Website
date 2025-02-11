import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Adventures in DevOps',
  tagline: "Get the experts' advice as they discuss the cutting edge DevOps ideas and technologies",
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://adventuresindevops.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'AdventuresInDevOps', // Usually your GitHub org/user name.
  projectName: 'Website', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        pages: {
          // path: '/src/pages',
          // routeBasePath: '/'
        },
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/AdventuresInDevops/Website/tree/main',
          showLastUpdateTime: true
        },
        blog: {
          routeBasePath: 'episodes',
          path: 'episodes',
          showReadingTime: false,
          feedOptions: {
            type: 'all',
            xslt: true,
            // title: '',
            // description: ''
          },
          editUrl: 'https://github.com/AdventuresInDevops/Website/tree/main',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'throw',
          onUntruncatedBlogPosts: 'ignore',
          blogSidebarTitle: ' ',
          blogSidebarCount: 'ALL'
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
          createSitemapItems: async (params) => {
            const {defaultCreateSitemapItems, ...rest} = params;
            const items = await defaultCreateSitemapItems(rest);
            return items.filter((item) => !item.url.includes('/page/'));
          },
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'posthog-docusaurus',
      {
        apiKey: 'phc_fc3NXJmYLZgUgFXm1GqPpUSGnpLeRgn2rtppFD5We8E',
        appUrl: process.env.POSTHOG_URL,
        hostUrl: 'https://eu.posthog.com',
        enableInDevelopment: false,
        session_recording: {
          maskAllInputs: false
        },
        persistence: 'localStorage',
        disable_session_recording: true
      }
    ],
    require.resolve('docusaurus-plugin-image-zoom')
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/media-banner.png',
    navbar: {
      title: 'Adventures in DevOps',
      logo: {
        alt: 'Adventures in DevOps',
        src: 'img/logo.jpg',
      },
      items: [
        {to: '/episodes', label: 'Episodes', position: 'left'},
        {to: '/docs/sponsorship', label: 'Sponsor', position: 'left'},
        {to: '/docs/guests', label: 'Guests', position: 'left'},
        { label: 'RSS', href: 'https://adventuresindevops.com/episodes/rss.xml', position: 'right' }
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Podcast',
          items: [
            {
              label: 'Episodes',
              to: '/episodes',
            },
            {
              label: 'Sponsor',
              to: '/docs/sponsorship',
            },
            {
              label: 'Hosts',
              to: '/episodes',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://adventuresindevops.com/join/',
            },
            {
              label: 'RSS Feed',
              href: 'https://adventuresindevops.com/episodes/rss.xml',
            }
          ],
        },
        {
          title: 'Connect',
          items: [
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/showcase/devops-podcast/about',
            },
            {
              label: 'YouTube',
              href: 'https://www.youtube.com/@AdventuresInDevOps',
            },
            {
              label: 'Bluesky',
              href: 'https://bsky.app/profile/adventuresindevops.bsky.social',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/AdventuresInDevops/Website',
            }
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Rhosys AG`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.okaidia
      // https://docusaurus.io/docs/next/markdown-features/code-blocks#supported-languages
      // additionalLanguages: ['csharp', 'java', 'ruby', 'php', 'json', 'diff']
    },
    zoom: {
      selector: '.markdown p > img',
      background: {
        light: 'rgba(0,0,0,.5)',
        dark: 'rgba(0,0,0,.5)'
      }
    }

  } satisfies Preset.ThemeConfig,
};

export default config;
