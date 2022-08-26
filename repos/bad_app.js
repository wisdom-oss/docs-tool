import { Octokit } from "@octokit/rest";
import fs from "fs/promises";
import path from "path";
import { unzip } from "unzipit";
import { fileURLToPath } from "url";
import sanitize from "sanitize-filename";
const USER_AGENT = "wisdom-oss-docs";
const ORGANIZATION = "wisdom-oss";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const octokit = new Octokit({
    auth: process.env["GITHUB_SECRET"],
    userAgent: USER_AGENT
});
const repoMap = new Map();
const apiMap = new Map();
const docMap = new Map();
const dataPath = path.join(__dirname, "..", "data/repos");
(async () => {
    // list all repos in the org
    let repoResponse = await octokit.rest.repos.listForOrg({
        org: ORGANIZATION,
        per_page: 100
    });
    // gather all branches for every repo
    let reqs = [];
    for (let { name, default_branch } of repoResponse.data) {
        reqs.push((async () => {
            let repoEntry = {
                defaultBranch: default_branch,
                branches: {}
            };
            let branchesResponse = await octokit.rest.repos.listBranches({
                owner: ORGANIZATION,
                repo: name
            });
            for (let { name: branch } of branchesResponse.data) {
                repoEntry.branches[branch] = path.join(dataPath, sanitize(name), sanitize(branch));
            }
            repoMap.set(name, repoEntry);
        })());
    }
    await Promise.all(reqs);
    // probably stupid but safe
    await fs.mkdir(dataPath, { recursive: true });
    await fs.rm(dataPath, { recursive: true });
    await fs.mkdir(dataPath, { recursive: true });
    // download every file from every repo and every branch
    let downloads = [];
    for (let [name, { defaultBranch, branches }] of repoMap) {
        for (let branch of Object.keys(branches)) {
            downloads.push((async () => {
                let { data } = await octokit.rest.repos.downloadZipballArchive({
                    owner: ORGANIZATION,
                    repo: name,
                    ref: branch
                });
                if (data instanceof ArrayBuffer) {
                    let zipInfo = await unzip(data);
                    for (let entry of Object.values(zipInfo.entries)) {
                        if (entry.name.endsWith("/"))
                            continue;
                        let filePath = entry.name.split("/");
                        filePath.shift();
                        let fileName = filePath.pop();
                        filePath.push(fileName.replace(/__(.+)__\.(\w+)/, "$1.$2"));
                        let insertPath = path.join(dataPath, sanitize(name), sanitize(branch), ...filePath);
                        // write file
                        await fs.mkdir(path.dirname(insertPath), { recursive: true });
                        await fs.writeFile(insertPath, Buffer.from(await entry.arrayBuffer()));
                        // check if api is there
                        if (path.basename(insertPath).match(/(open)?api\.ya?ml/)) {
                            apiMap.set([name, branch], insertPath);
                        }
                        let docsFragment = path.sep + "docs" + path.sep;
                        if (insertPath.includes(docsFragment)) {
                            docMap.set([name, branch], insertPath);
                        }
                    }
                }
            })());
        }
    }
    await Promise.all(downloads);
    // transform map to object and stringify in meta file repos.json
    let jsonOut = {};
    for (let [key, val] of repoMap) {
        jsonOut[key] = val;
    }
    await fs.writeFile(path.join(dataPath, "repos.json"), JSON.stringify(jsonOut, null, 2));
    let apiOut = [];
    for (let [key, val] of apiMap) {
        apiOut.push(["docusaurus-plugin-redoc", {
                spec: val,
                route: `repos/${sanitize(key[0])}/${sanitize(key[1])}/api`,
                id: `repos-${sanitize(key[0])}-${sanitize(key[1])}-api`
            }]);
    }
    await fs.writeFile(path.join(dataPath, "apis.json"), JSON.stringify(apiOut, null, 2));
    let docOut = [];
    let docIds = [];
    for (let [key, val] of docMap) {
        let id = `repos-${sanitize(key[0])}-${sanitize(key[1])}-docs`;
        if (docIds.includes(id))
            continue;
        docOut.push(["@docusaurus/plugin-content-docs", {
                path: val,
                routeBasePath: `repos/${sanitize(key[0])}/${sanitize(key[1])}/docs`,
                id: id
            }]);
        docIds.push(id);
    }
    await fs.writeFile(path.join(dataPath, "docs.json"), JSON.stringify(docOut, null, 2));
})();
