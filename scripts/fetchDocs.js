const githubAPI = "https://api.github.com";
const org = "wisdom-oss";

(async function() {
  const util = await import("util");
  const fs = await import("fs");
  const path = await import("path");

  const pat = fs.readFileSync(path.join(__dirname, ".pat"), "utf8").trim();


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
    for (let branch of branchesJson) {
      fs.mkdirSync(
        path.join(__dirname, "repos", repo.name, branch.name),
        {recursive: true}
      );
      branches.push(branch.name);

      // fetching the readme
      let readmeReq = await fetch(
        `${githubAPI}/repos/${org}/${repo.name}/readme?ref=${branch.name}`
      );
      let hasReadme = false;
      if (readmeReq.ok) {
        let readmeJson = await readmeReq.json();
        let readmeContentReq = await fetch(readmeJson.download_url);
        if (readmeContentReq.ok) {
          fs.writeFileSync(
            path.join(__dirname, "repos", repo.name, branch.name, "README.md"),
            (await readmeContentReq.text())
              .replaceAll("<br>", "<br/>")
              .replaceAll("<hr>", "<hr/>")
          );
          hasReadme = true;
        }
      }

      // fetching api
      let hasAPI = false;
      let rootReq = await fetch(`${githubAPI}/repos/${org}/${repo.name}/contents`);
      let rootJson = await rootReq.json();
      for (let root of rootJson) {
        if (root.name.startsWith("api.")) {
          let apiReq = await fetch(root.download_url);
          fs.writeFileSync(
            path.join(__dirname, "repos", repo.name, branch.name, root.name),
            await apiReq.text()
          );
          hasAPI = root.name;
        }
      }

      branches.push({name: branch.name, hasReadme, hasAPI});
    }


    repos[repo.name] = {
      name: repo.name,
      defaultBranch: repo.default_branch,
      branches
    };
  }

  console.log(util.inspect(repos, {depth: 4, colors: true}));

  fs.writeFileSync(
    path.join(__dirname, "repos.json"),
    JSON.stringify(repos, null, 2)
  );
})();
