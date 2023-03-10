# WISdoM OSS Docs-Tool Admin

This project is a Node.js application that is part of the WISdoM OSS Docs-Tool. It manages all of the other components and serves as the main entry point for the compiled documentation. This application supports authorized PUT requests to rebuild the entire documentation.

## Endpoints

The server provides two endpoints:

- `GET /admin.*`: Returns a `405 Method Not Allowed` response.
- `PUT /admin.*`: Updates the documentation. Requires an `Authorization` header with a bearer token set to the value of the `ADMIN_SECRET` environment variable.

### PUT Endpoint

When the `PUT` endpoint is called, the server will rebuild the entire documentation. The following steps are taken:

1. The server acquires a lock to prevent multiple requests from updating the documentation simultaneously.
2. The server kills the static file server and the Docusaurus server that were started previously.
3. The server updates the repository content.
4. The server starts a new static file server.
5. The server builds the Docusaurus documentation.
6. The server starts a new Docusaurus server.
7. The server releases the lock.

To call the `PUT` endpoint, send a `PUT` request to `/admin.*`. The `Authorization` header should contain a bearer token set to the value of the `ADMIN_SECRET` environment variable.

### GET Endpoint

The `GET` endpoint returns a `405 Method Not Allowed` response for all requests to `/admin.*`. This endpoint is not used for updating the documentation.

## Files

- `app.js`: The main entry point for the application, which sets up the server and the endpoints.
- `cmd/caddy.js`: A script that starts and logs the Caddy server.
- `cmd/docusaurus-build.js`: A script that calls the `npm run build` script in the `docusaurus` `package.json` file to build the Docusaurus documentation.
- `cmd/docusaurus-serve.js`: A script that calls the `npm run serve` script in the `docusaurus` `package.json` file to start and log the Docusaurus server.
- `cmd/repos.js`: A script that calls the `npm run start` script in the `repos` `package.json` file to update the repository content.
- `cmd/static.js`: A script that calls the `npm run serve-static` script in the main `package.json` file to start and log the static file server.

That's all!
