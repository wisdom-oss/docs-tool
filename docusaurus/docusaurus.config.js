const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const repos = require("../data/repos/repos.json");

const config = {
  title: "WISdoM OSS Docs",
  url: "https://docs.wisdom-demo.uol.de",
  baseUrl: "/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  plugins: [
    "@docusaurus/plugin-content-pages"
  ].concat(repos),

  themes: [
    "@docusaurus/theme-classic",
    "docusaurus-theme-redoc",
    "@docusaurus/theme-mermaid"
  ],

  markdown: {
    mermaid: true
  },

  themeConfig:
    ({
      colorMode: {
        defaultMode: "light",
        disableSwitch: true,
        respectPrefersColorScheme: true
      },
      navbar: {
        title: "WISdoM OSS Docs",
        logo: {
          alt: "My Site Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "custom-other-global-docs"
          },
          {
            type: "custom-other-docs-on-branch"
          },
          {
            type: "custom-branch-select",
            position: "right"
          }
        ]
      },
      footer: {
        style: "dark",
        links: [
          {
            label: "Github",
            href: "https://github.com/wisdom-oss",
          },
          {
            label: "Demo",
            href: "https://wisdom-demo.uni-oldenburg.de"
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} WISdoM`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
