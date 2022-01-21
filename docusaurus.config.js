// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const fs = require('fs');
const path = require('path');
const plugin = require("remark-admonitions");

const reposContent = fs.readFileSync(path.join(__dirname, "repos.json"), "utf8");
const repos = JSON.parse(reposContent);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'WISdoM Docs',
  tagline: 'WISdoM Docs',
  url: 'https://wisdom.uol.de/',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'wisdom-oss', // Usually your GitHub org/user name.
  projectName: 'WISdoM', // Usually your repo name.
  staticDirectories: ["static", "static-docs"],

  plugins: [
    '@docusaurus/theme-classic',
    //"@docusaurus/plugin-debug",
    "@docusaurus/plugin-content-pages"
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
            type: "dropdown",
            position: "right",
            items: [],
            customType: "branchSelect",
            branches: reposBranches()
          },
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
        copyright: `Copyright © ${new Date().getFullYear()} WISdoM. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

function reposNavbar() {
  let items = [];
  for (let repo of Object.values(repos)) {
    if (repo.private) continue;
    let {hasAPI, hasDocs, hasReadme, hasStaticDocs} = repo.defaultBranch;
    if (!(hasAPI || hasDocs || hasReadme || hasStaticDocs)) continue;
    let item = {
      label: repo.name,
      position: "left"
    }
    if (hasReadme) {
      item.to = `repos/${repo.name}/${repo.defaultBranch.name}/README`;
    }
    if (hasAPI || hasDocs || hasStaticDocs) {
      item.items = [];
      item.type = "dropdown";
      if (hasAPI) {
        item.items.push({
          to: `repos/${repo.name}/${repo.defaultBranch.name}/api`,
          label: "Rest API"
        });
      }
      if (hasDocs) {
        item.items.push({
          to: `repos/${repo.name}/${repo.defaultBranch.name}/${repo.defaultBranch.hasDocs.split(".md")[0]}`,
          label: "Docs"
        });
      }
      if (hasStaticDocs) {
        item.items.push({
          to: `repos/${repo.name}/${repo.defaultBranch.name}/docs`,
          label: "Docs"
        });
      }
    }
    items.push(item);
  }
  return items;
}

function reposDocs() {
  let plugins = [];
  for (let repo of Object.values(repos)) {
    for (let branch of repo.branches) {
      if (branch[1].hasReadme) {
        plugins.push([
          "@docusaurus/plugin-content-pages",
          {
            id: `repos_pages_${repo.name.replaceAll(/\s+/g, "_")}_${branch[0].replaceAll(/\s+/g, "_")}`,
            path: `repos/${repo.name}/${branch[0]}/readme`,
            routeBasePath: `repos/${repo.name}/${branch[0]}/`
          }
        ])
      }

      if (branch[1].hasDocs) {
        plugins.push([
          "@docusaurus/plugin-content-docs",
          {
            id: `repos_docs_${repo.name.replaceAll(/\s+/g, "_")}_${branch[0].replaceAll(/\s+/g, "_")}`,
            path: `repos/${repo.name}/${branch[0]}/docs/`,
            routeBasePath: `repos/${repo.name}/${branch[0]}/docs/`,
            sidebarPath: require.resolve("./src/sidebar.js")
          }
        ]);
      }

      if (branch[1].hasAPI) {
        plugins.push([
          "docusaurus-plugin-openapi",
          {
            id: `repos_api_${repo.name.replaceAll(/\s+/g, "_")}_${branch[0].replaceAll(/\s+/g, "_")}`,
            path: `repos/${repo.name}/${branch[0]}/${branch[1].hasAPI}`,
            routeBasePath: `repos/${repo.name}/${branch[0]}/api`
          }
        ])
      }

      if (branch[1].hasStaticDocs) {
        plugins.push([
          "@docusaurus/plugin-content-pages",
          {
            id: `repos_static_docs_${repo.name.replaceAll(/\s+/g, "_")}_${branch[0].replaceAll(/\s+/g, "_")}`,
            path: "src/staticViewer",
            routeBasePath: `repos/${repo.name}/${branch[0]}/docs`
          }
        ])
      }
    }
  }
  return plugins;
}

function reposBranches() {
  let branchSelect = {};
  for (let repo of Object.values(repos)) {
    branchSelect[repo.name] = [];
    for (let [branch] of repo.branches) {
      branchSelect[repo.name].push(branch);
    }
  }
  return branchSelect;
}

module.exports = config;
