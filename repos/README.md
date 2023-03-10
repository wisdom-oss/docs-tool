# WISdoM OSS Docs-Tool Repos

This part of the WISdoM OSS Docs-Tool fetches information about all the 
repositories in the organization `wisdom-oss` on GitHub, and then downloads all 
the documentation files from each repository's branches. 
It then constructs a configuration for Docusaurus plugins that will be used to 
build the final documentation website.

## Scripts

- `build`: compiles the TypeScript code into JavaScript
- `start`: starts the app by running the compiled JavaScript

## Description

The tool starts by fetching information about all the repositories using the 
GitHub REST API. 
For each repository, it determines the repository's name, display name, group 
(based on the prefix of the repository name), default branch, and all its 
branches. 
It then downloads the documentation files for each repository branch. 
The tool identifies files related to documentation, such as `README.md`, 
`openapi.yml`, `sidebar.json`, and all `.md` files under the `docs` directory 
or any static webpages in the `static-docs` directory (usually one of them 
exists).
The tool only keeps the relevant documentation files with the sole exception the 
`docs` repository, it will keep all the files stored in it.

Once it has downloaded all the documentation files, the tool constructs a 
configuration JSON for each `docusaurus` plugin that will be used to generate 
the final documentation website. 
The plugins include `@docusaurus/plugin-content-docs` for Markdown documentation 
files, `@docusaurus/plugin-content-pages` for `README.md` files, 
`docusaurus-plugin-redoc` for OpenAPI specification files, and a custom plugin 
for static files.

Finally, the tools saves the plugin configuration to a file, as well as 
metadata about each repository, such as the branches it has, which ones have 
documentation, and where the documentation files are located. 
It also saves the `docs.json` of the default branch of the `docs` repository, 
which will be used at the top of the documentation website as entry points for 
an overview of the whole application.
