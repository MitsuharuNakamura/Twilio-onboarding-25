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
      label: 'ハンズオン',
      items: [
        'sms',
        'voice',
        'apps',
      ],
    },
  ],
};

export default sidebars;