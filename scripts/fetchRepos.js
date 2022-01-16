const githubAPI = "https://api.github.com";
const org = "wisdom-oss";

(async function() {
  const util = await import("util");
  const fs = await import("fs");
  const path = await import("path");
  const fetchRepo = await import("./fetchRepo.js");

  const pat = fs.readFileSync(path.join(__dirname,"..", ".pat"), "utf8").trim();


  const nodeFetch = await import("node-fetch");
  const fetch = function(url, init) {
    let requestInit = init ?? {};
    requestInit.headers  = requestInit.headers ?? {};
    requestInit.headers.Authorization = "token " + pat;
    return nodeFetch.default(url, requestInit);
  }

  let reposReq = await fetch(`${githubAPI}/orgs/${org}/repos`);
  if (!reposReq.ok) {
    console.error(reposReq);
    return;
  }
  let reposJson = await reposReq.json();

  let repos = {};
  for (let repo of reposJson) {

    let branchesReq = await fetch(repo.branches_url.split("{/branch}")[0]);
    let branchesJson = await branchesReq.json();
    let branches = [];
    let [hasAPI, hasDocs, hasReadme] = [false, false, false];
    for (let branch of branchesJson) {
      let has = await fetchRepo.default(repo.name, branch.name);
      branches.push([branch.name, has]);
      if (branch.name === repo.default_branch) {
        hasAPI = has.hasAPI;
        hasDocs = has.hasDocs;
        hasReadme = has.hasReadme;
      }
    }


    repos[repo.name] = {
      name: repo.name,
      defaultBranch: {
        name: repo.default_branch,
        hasAPI, hasDocs, hasReadme
      },
      branches
    };
  }

  fs.writeFileSync(
    path.join(__dirname, "../repos.json"),
    JSON.stringify(repos, null, 2)
  );
})();
