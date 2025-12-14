import {themes as prismThemes} from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  customFields: {
    isDevelopment: process.env.NODE_ENV === 'development'
  },

  title: 'Adventures in DevOps',
  tagline: "DevOps at the intersection of business and technology.",
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
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    },

    parseFrontMatter: async (params) => {
      // Reuse the default parser
      const result = await params.defaultParseFrontMatter(params);

      if (params.filePath.includes('/0-archive/')) {
        result.frontMatter.slug = params.filePath.match(/[/]0-archive[/]([a-zA-Z0-9-]+)[/]/)[1];
      }

      const dateMatcher = result.frontMatter.slug?.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
      if (dateMatcher) {
        result.frontMatter.slug = `${dateMatcher[1].replace(/-/g, '/')}/${dateMatcher[2]}`;
      }

      return result;
    }
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
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
          showLastUpdateTime: true,
          sidebarCollapsed: false
        },
        blog: {
          blogTitle: "Episodes | Adventures In DevOps",
          routeBasePath: 'episodes',
          authorsBasePath: 'hosts',
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
          blogSidebarCount: 'ALL',
          postsPerPage: 26
        },
        theme: {
          customCss: './src/css/custom.scss'
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

  clientModules: ['./src/scripts/fontawesome.ts'],

  plugins: [
    require.resolve('./src/plugins/podcastS3Storage.ts'),
    [
      'posthog-docusaurus',
      {
        apiKey: 'phc_rWh2htu3GbLeyOXDnpBG0AKa38AhMmRs36ZnUvg2Elf',
        appUrl: process.env.POSTHOG_URL || 'https://eu.i.posthog.com',
        hostUrl: 'https://eu.posthog.com',
        enableInDevelopment: false,
        session_recording: {
          maskAllInputs: false
        },
        persistence: 'localStorage',
        disable_session_recording: false
      }
    ],
    require.resolve('docusaurus-plugin-image-zoom'),
    'docusaurus-plugin-sass',
    require.resolve('./src/plugins/recommendedEpisodesPlugin.js')
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false
    },
    image: '/img/logo.jpg',
    navbar: {
      title: 'Adventures in DevOps',
      logo: {
        alt: 'Adventures in DevOps',
        src: 'img/logo.jpg',
      },
      items: [
        // NOTE: shorter is better because on medium screens this text gets crimped.
        {to: '/episodes', label: '📍 Episodes', position: 'left'},
        {to: '/docs/guests', label: '📹 Guest Request', position: 'left'},
        // {to: '/docs/guests', label: 'Guests', position: 'left'},
        {to: '/docs/sponsorship', label: '🔈 Sponsor', position: 'left'},

        // RIGHT
        {to: '/', label: '🔔', position: 'right'}
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Podcast',
          items: [
           {
              label: 'All episodes',
              to: '/episodes',
            },
            {
              label: '📹 Guest appearance application',
              to: '/docs/guests'
            },
            {
              label: '🔈 Sponsor the show',
              to: '/docs/sponsorship'
            }
          ],
        },
        {
          title: 'Connect with us',
          items: [
            {
              label: 'Discord Community',
              href: 'https://adventuresindevops.com/join/',
            },
            {
              label: 'Hosts: more about us!',
              to: '/episodes/hosts',
            },
            {
              label: 'Share Feedback for us',
              to: '/survey'
            }
          ],
        },
        {
          title: 'Follow us',
          items: [
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/showcase/devops-podcast/about',
            },
            {
              label: 'Bluesky',
              href: 'https://bsky.app/profile/adventuresindevops.bsky.social',
            },
            {
              label: 'Join the Community',
              href: 'https://adventuresindevops.com/join'
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
      },
      // https://github.com/francoischalifour/medium-zoom?tab=readme-ov-file#options
      config: {}
    }

  } satisfies Preset.ThemeConfig,
};

export default config;
