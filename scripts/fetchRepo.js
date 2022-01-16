const githubAPI = "https://api.github.com";
const org = "wisdom-oss";
const filter = /^((docs)|([^/]*api[^/]*)|([^/]*readme[^/]*))/i;

module.exports = async function(repo, branch) {
  const util = await import("util");
  const fs = await import("fs");
  const path = await import("path");
  const nodeFetch = await import("node-fetch");
  const unzipit = await import("unzipit");
  const sanitizeMD = await import("./sanitizeMD.js");

  const pat = fs.readFileSync(path.join(__dirname, "..", ".pat"), "utf8").trim();

  const fetch = function(url, init) {
    let requestInit = init ?? {};
    requestInit.headers  = requestInit.headers ?? {};
    requestInit.headers.Authorization = "token " + pat;
    return nodeFetch.default(url, requestInit);
  }

  const response = await fetch(`${githubAPI}/repos/${org}/${repo}/zipball/${branch}`);
  if (!response.ok) throw new Error(
    `Unexpected response for ${repo}/${branch}: ${response.statusText}`
  );
  const arrayBuffer = await response.arrayBuffer();

  const zipInfo = await unzipit.unzip(arrayBuffer);
  let [hasDocs, hasReadme, hasAPI] = [false, false, false];
  for (let [key, entry] of Object.entries(zipInfo.entries)) {
    if (entry.isDirectory) continue;
    let fileName = key.split("/").slice(1).join("/");
    if (!fileName.match(filter)) continue;
    let filePath = path.join(__dirname, "../repos", repo, branch, fileName);
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    if (fileName.match(/readme[^/]*$/i)) hasReadme = true;
    if (fileName.match(/^docs\//i)) {
      if (fileName.endsWith(".md")) hasDocs = fileName;
    }
    if (fileName.match(/((open)?api\.(json|yml|yaml))/i)) hasAPI = fileName;
    if (fileName.endsWith(".md")) {
      let sanitizedMD = sanitizeMD.default(await entry.text());
      if (fileName.match(/readme[^/]*$/i)) {
        hasReadme = true;
        filePath = path.join(path.dirname(filePath), "readme", "README.md");
        fs.mkdirSync(path.dirname(filePath), {recursive: true});
      }
      fs.writeFileSync(
        filePath,
        sanitizedMD
      );
    }
    else {
      fs.writeFileSync(
        filePath,
        new DataView(await entry.arrayBuffer())
      );
    }
  }

  return {
    hasAPI, hasDocs, hasReadme
  };
};
