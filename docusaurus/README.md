# WISdoM OSS Docs-Tool Docusaurus

This is the main rendering tool for all the documentation that is part of the 
WISdoM OSS organization. 
It uses Docusaurus, a documentation tool created by Facebook, to generate 
documentation sites.

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

