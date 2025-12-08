import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Home',
    },
    {
      type: 'category',
      label: '座学',
      items: [
        'sendgrid-intro',
        'sendgrid-console',
      ],
    },
    {
      type: 'category',
      label: 'ハンズオン',
      items: [
        'sendgrid',
        'sms',
        'voice',
        'apps',
      ],
    },
    {
      type: 'doc',
      id: 'functions',
      label: 'Functions & Assets',
    },
  ],
};

export default sidebars;