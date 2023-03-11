# WISdoM OSS Docs-Tool Docusaurus

This is the main rendering tool for all the documentation that is part of the 
WISdoM OSS organization. 
It uses [Docusaurus](https://docusaurus.io), a documentation tool created by 
Facebook, to generate documentation sites.

The plugin configuration of this Docusaurus instance is highly customized using 
a lot of generation from the `repos` part of the docs tool. 
This means that every repository under the WISdoM OSS organization that has 
documentation will have a page in this dashboard.

The main site is a dashboard containing every repository and every branch of 
them with links to the rendered documentation.
The documentation pages allow for quick navigation between the README, docs, and 
API (if available), and a custom dropdown in the top right corner of every 
documentation module allows for quick switching between branches. 
In cases where a repository cannot generate markdown documentation, a custom 
wrapper is created to display statically generated web pages.

## Plugins

This Docusaurus instance uses the following plugins to render graphs and API 
documentation:

- [Mermaid via @docusaurus/theme-mermaid](https://docusaurus.io/docs/next/api/themes/@docusaurus/theme-mermaid) - 
  a JavaScript-based diagramming and charting tool used to create flowcharts, 
  sequence diagrams, and other types of diagrams directly in Markdown files. 
  Mermaid is used to render graphs in the documentation.

- [Redoc via redocusaurus](https://github.com/rohit-gohri/redocusaurus) - 
  an open-source API documentation tool used to generate interactive API 
  documentation from OpenAPI (formerly Swagger) specification files. 
  Redoc is used to render API documentation in the documentation.

## Swizzled Components

A few Navbar items have been customized to provide extra functionality to the 
documentation site:

- `BranchSelectNavbarItem.jsx` - A custom dropdown in the top right corner of 
  every documentation module that allows for quick switching between branches.

- `OtherDocsOnBranchNavbarItem.jsx` - Links to README, Docs, and API (if 
  available) for the current repository and branch.

- `OtherGlobalDocsNavbarItem.jsx` - Links to other documentation categories in 
  the Docs repository.

*Please note that these swizzled components may break or require updates in the 
future as Docusaurus evolves.*

