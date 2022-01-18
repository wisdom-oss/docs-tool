/** GitHub API url */
const githubAPI = "https://api.github.com";
/** GitHub organization name */
const org = "wisdom-oss";
/** filter for the file extraction from the archive */
const filter = /^((docs)|([^/]*api[^/]*)|([^/]*readme[^/]*))/i;

/**
 * This function downloads the repo data for a specific repo and branch and
 * extract from the pulled archive the data needed for the docs.
 * @param repo Name of the repo
 * @param branch Name of the branch
 * @param pat personal access token for authorization
 * @returns {Promise<{hasAPI: boolean|string, hasDocs: boolean, hasReadme: boolean}>}
 */
module.exports = async function(repo, branch, pat) {
  // importing asynchronously packages
  const util = await import("util");
  const fs = await import("fs");
  const path = await import("path");
  const nodeFetch = await import("node-fetch");
  const unzipit = await import("unzipit");
  const sanitizeMD = await import("./sanitizeMD.js");
  const HttpsProxyAgent = (await import("https-proxy-agent")).default;
  const sanitizeFileName = (await import("./sanitizeFileName.js")).default;

  // define fetch function as node-fetch's fetch but add the auth header
  const fetch = function(url, init) {
    let requestInit = init ?? {};
    requestInit.headers  = requestInit.headers ?? {};
    requestInit.headers.Authorization = "token " + pat;
    if (process.env.HTTPS_PROXY) {
      requestInit.agent = new HttpsProxyAgent(process.env.HTTPS_PROXY);
    }
    return nodeFetch.default(url, requestInit);
  }

  // fetch the repository as an zip archive
  const response = await fetch(`${githubAPI}/repos/${org}/${repo}/zipball/${branch}`);
  if (!response.ok) throw new Error(
    `Unexpected response for ${repo}/${branch}: ${response.statusText}`
  );

  // get the archive as array buffer for further treatment
  const arrayBuffer = await response.arrayBuffer();

  // unzip the archive from the buffer
  const zipInfo = await unzipit.unzip(arrayBuffer);

  let [hasDocs, hasReadme, hasAPI] = [false, false, false];

  for (let [key, entry] of Object.entries(zipInfo.entries)) {
    // iterate over every entry in the zip archive to check what should be
    // extracted and how

    // directories will be skipped since they will be created automatically if
    // needed
    if (entry.isDirectory) continue;

    // GitHub creates an archive with a directory inside it, this will skip that
    // in the filename
    let fileName = key.split("/").slice(1).join("/");
    fileName = sanitizeFileName(fileName);

    // check against the filter
    if (!fileName.match(filter)) continue;

    // filePath inside the project and create it, if necessary
    let filePath = path.join(__dirname, "../repos", repo, branch, fileName);
    fs.mkdirSync(path.dirname(filePath), {recursive: true});

    // check for readmes
    if (fileName.match(/readme[^/]*$/i)) hasReadme = true;

    // check for doc files
    if (fileName.match(/^docs\//i)) {
      if (fileName.endsWith(".md")) hasDocs = fileName;
    }

    // check for an API declaration
    if (fileName.match(/((open)?api\.(json|yml|yaml))/i)) hasAPI = fileName;

    if (fileName.endsWith(".md")) {
      // if the file ends with ".md" we need to sanitize it and if it's a
      // readme, we need to move it somewhere else
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
      // write file as is
      fs.writeFileSync(
        filePath,
        new DataView(await entry.arrayBuffer())
      );
    }
  }

  return {
    // return the metadata for the branch
    hasAPI, hasDocs, hasReadme
  };
};
