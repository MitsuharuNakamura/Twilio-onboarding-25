import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Home',
    },
    {
      type: 'doc',
      id: 'agenda',
      label: 'Agenda',
    },
    {
      type: 'category',
      label: 'ハンズオン',
      items: [
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