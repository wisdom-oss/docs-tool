// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const fs = require('fs');
const path = require('path');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'WISdoM Docs',
  tagline: 'WISdoM Docs',
  url: 'https://wisdom.uol.de/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'wisdom-oss', // Usually your GitHub org/user name.
  projectName: 'WISdoM', // Usually your repo name.

  plugins: [
    '@docusaurus/theme-classic'
    // @ts-ignore
  ].concat(reposDocs()),

  themes: [
    "docusaurus-theme-openapi"
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'WISdoM Docs',
        logo: {
          alt: 'WISdoM Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            href: 'https://github.com/wisdom-oss',
            label: 'GitHub',
            position: 'right',
          },
          // @ts-ignore
        ].concat(reposNavbar()),
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/docusaurus',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/facebook/docusaurus',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

function reposNavbar() {
  let reposContent = fs.readFileSync(path.join(__dirname, "repos.json"), "utf8");
  let repos = JSON.parse(reposContent);

  let items = [];
  for (let repo of Object.values(repos)) {
    items.push({
      to: `repos/${repo.name}/${repo.defaultBranch}/`,
      label: repo.name,
      position: 'left'
    })
  }
  return items;
}

function reposDocs() {
  let reposContent = fs.readFileSync(path.join(__dirname, "repos.json"), "utf8");
  let repos = JSON.parse(reposContent);

  let plugins = [];
  for (let repo of Object.values(repos)) {
    if (!repo.branches.some(branch => branch.hasReadme)) continue;
    plugins.push([
      "@docusaurus/plugin-content-docs",
      {
        id: `repos_docs_${repo.name.replaceAll(/\s+/g, "_")}`,
        path: `repos/${repo.name}`,
        routeBasePath: `repos/${repo.name}`,
        sidebarPath: require.resolve("./repos/sidebar.js"),
      }
    ])

    for (let branch of repo.branches) {
      if (branch.name !== "main") continue;
      if (branch.hasAPI) {
        plugins.push([
          "docusaurus-plugin-openapi",
          {
            id: `repos_api_${repo.name.replaceAll(/\s+/g, "_")}`,
            path: `repos/${repo.name}/${branch.name}/${branch.hasAPI}`,
            routeBasePath: `repos/${repo.name}/${branch.name}/api`
          }
        ])
      }
    }
  }
  return plugins;
}

module.exports = config;
