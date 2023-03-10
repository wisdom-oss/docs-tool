# WISdoM OSS Docs-Tool

The WISdoM OSS Docs-Tool is a collection of tools and scripts used to generate 
and manage documentation for the WISdoM OSS organization. 
It is designed to automatically fetch documentation files from all the 
repositories in the organization, generate a unified dashboard for all the 
documentation, and update it as necessary.

## Parts

The WISdoM OSS Docs-Tool consists of three parts:

### [repos](repos/README.md)

Fetches information about all the repositories in the organization wisdom-oss on
GitHub, and downloads all the documentation files from each repository's
branches.
It then constructs a configuration for Docusaurus plugins that will be used to
build the final documentation website.

### [docusaurus](docusaurus/README.md)

The main rendering tool for all the documentation that is part of the WISdoM OSS
organization.
It uses [Docusaurus](https://docusaurus.io), a documentation tool created by 
Facebook, to generate documentation sites.

### [admin](admin/README.md)

A Node.js application that manages all the other components and serves as the
main entry point for the compiled documentation.
It supports authorized PUT requests to rebuild the entire documentation.

## Environment Variables

The following environment variables are required to run the Docs-Tool:

- `GITHUB_SECRET`: A personal access token for the GitHub API, used to fetch the 
  repositories and their documentation.

- `ADMIN_SECRET`: The bearer token used to authorize the PUT `/admin.*` endpoint. 
  This is required for updating the documentation.

## Dependencies
- Node.js (>= 14.0.0)
- PNPM (>= 7.3.0)
- Caddy (>= 2.4.5)

## Installation

To install the WISdoM OSS Docs-Tool, clone the repository and install the 
dependencies using pnpm:

```bash
git clone https://github.com/wisdom-oss/docs-tool.git
cd docs-tool/
pnpm install
```

## Usage

### Starting the Docs-Tool

To start the Docs-Tool, run the following command:

```bash
pnpm start
```

This will start the admin/ application, which will start the other components of 
the docs-tool.

### Updating the Documentation

To update the documentation, send an authorized PUT request to `/admin.*`, 
where * can be any path. 
The Authorization header should contain a bearer token set to the value of the 
`ADMIN_SECRET` environment variable.

### Accessing the Documentation

Once the docs-tool is running, you can access the documentation at 
http://localhost:3000. 
This will take you to the main dashboard that lists all the repositories and 
branches that have documentation available.

Clicking on a repository will take you to its documentation page, where you can 
switch between branches using a custom dropdown in the top right corner. 
The documentation page allows you to quickly navigate between the README, docs, 
and API (if available).

## Deployment via Docker
You can use Docker to build a standalone container for the Docs-Tool. 
Note that this container is larger (1GB+) compared to other containers used in 
the WISdoM OSS organization, as it requires several tools to rebuild parts of 
itself on demand.

To build the container, use the following command:

```bash
docker build -t wisdom-oss/docs-tool:latest .
```

Once the container is built, you can run it using:

```bash
docker run -it --rm -p 3000:3000 -e GITHUB_SECRET=<your-token-here> -e ADMIN_SECRET=<your-admin-secret-here> wisdom-oss/docs-tool:latest
```

Make sure you set the necessary environment variables (`GITHUB_SECRET` and 
`ADMIN_SECRET`) for the container to function properly. 
Also, bind the exposed port (3000) to interact with the container.


