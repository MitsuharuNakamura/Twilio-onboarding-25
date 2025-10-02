import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';

const config: Config = {
  title: 'Twilio Workshop 2025',
  tagline: 'SMS・Voice・Appsを使ったハンズオン',
  favicon: 'img/favicon.ico',

  url: 'https://MitsuharuNakamura.github.io',
  baseUrl: '/Twilio-onboarding-25/',

  organizationName: 'MitsuharuNakamura',
  projectName: 'Twilio-onboarding-25',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/MitsuharuNakamura/Twilio-onboarding-25/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Twilio Workshop',
      logo: {
        alt: 'Twilio Logo',
        src: 'img/images.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'index',
          position: 'left',
          label: 'Home',
        },
        {
          type: 'doc',
          docId: 'sms',
          position: 'left',
          label: 'SMS',
        },
        {
          type: 'doc',
          docId: 'voice',
          position: 'left',
          label: 'Voice',
        },
        {
          type: 'doc',
          docId: 'apps',
          position: 'left',
          label: 'Apps',
        },
        {
          href: 'https://github.com/MitsuharuNakamura/Twilio-onboarding-25',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Workshop Home',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Twilio Japan',
              href: 'https://www.twilio.com/ja-jp',
            },
            {
              label: 'Twilio Docs',
              href: 'https://www.twilio.com/docs',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/MitsuharuNakamura/Twilio-onboarding-25',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Twilio Workshop. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;