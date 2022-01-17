/** GitHub API url */
const githubAPI = "https://api.github.com";
/** GitHub organization name */
const org = "wisdom-oss";

/**
 * Async function to fetch all repositories from the organization and pull the
 * data from all the branches.
 *
 * This is required to be run at least once to include the repo data for the
 * docs.
 */
(async function() {
  // importing asynchronously packages
  const util = await import("util");
  const fs = await import("fs");
  const path = await import("path");
  const fetchRepo = await import("./fetchRepoBranch.js");
  const nodeFetch = await import("node-fetch");

  // load personal access token to authorization
  const pat = fs.readFileSync(path.join(__dirname,"..", ".pat"), "utf8").trim();

  // define fetch function as node-fetch's fetch but add the auth header
  const fetch = function(url, init) {
    let requestInit = init ?? {};
    requestInit.headers  = requestInit.headers ?? {};
    requestInit.headers.Authorization = "token " + pat;
    return nodeFetch.default(url, requestInit);
  }

  // fetch all repos from the organization
  let reposReq = await fetch(`${githubAPI}/orgs/${org}/repos`);
  if (!reposReq.ok) {
    console.error(reposReq);
    return;
  }
  let reposJson = await reposReq.json();

  // remove old repo data
  fs.rmSync(path.join(__dirname, "../repos"), {recursive: true});

  // prepare repos object to be filled later
  let repos = {};

  // parallelize fetching all repos
  let repoPromises = [];
  for (let repo of reposJson) {
    repoPromises.push(new Promise(async resolve => {
      // fetch all branch meta data for a specific repository
      let branchesReq = await fetch(repo.branches_url.split("{/branch}")[0]);
      let branchesJson = await branchesReq.json();

      // prepare branch collection
      let branches = [];
      let [hasAPI, hasDocs, hasReadme] = [false, false, false];

      // parallelize fetching all branches
      let branchPromises = [];
      for (let branch of branchesJson) {
        branchPromises.push(new Promise(async resolve => {
          // fetch the branch data
          let has = await fetchRepo.default(repo.name, branch.name, pat);

          // prepare fetched meta data for global usage
          branches.push([branch.name, has]);
          if (branch.name === repo.default_branch) {
            hasAPI = has.hasAPI;
            hasDocs = has.hasDocs;
            hasReadme = has.hasReadme;
          }

          // finalize branch thread
          resolve();
        }));
      }
      await Promise.all(branchPromises);

      repos[repo.name] = {
        name: repo.name,
        private: repo.private,
        defaultBranch: {
          name: repo.default_branch,
          hasAPI, hasDocs, hasReadme
        },
        branches
      };

      // finalize repo thread
      resolve();
    }))
  }

  // wait until all repos are fully fetched, includes the fetching of every
  // branch
  await Promise.all(repoPromises);

  fs.writeFileSync(
    path.join(__dirname, "../repos.json"),
    JSON.stringify(repos, null, 2)
  );
})();
