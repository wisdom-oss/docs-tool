import {Octokit} from "@octokit/rest";
import fs from "fs/promises";
import path from "path";
import {unzip, ZipEntry} from "unzipit";
import {fileURLToPath} from "url";
import sanitize from "sanitize-filename";

const USER_AGENT = "wisdom-oss-docs";
const ORGANIZATION = "wisdom-oss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const octokit = new Octokit({
  auth: process.env["GITHUB_SECRET"],
  userAgent: USER_AGENT
});

enum RepoGroups {
  SERVICE =  "service",
  FRONTEND = "frontend",
  OTHER = "other"
}
namespace RepoGroups {
  export function findGroup(name: string) {
    for (let [key, val] of Object.entries(RepoGroups)) {
      // @ts-ignore enums are a bit wonky in that regard
      if (name.startsWith(val + "-")) return RepoGroups[key];
    }
    return RepoGroups.OTHER;
  }
}

/** Repository slug, used to identify repositories. */
type slug = string;

(async () => {
  console.info("fetching all repos");
  let repos = await fetchAllMeta();
  console.info("clearing data dir");
  await clearDataDir();
  console.info("downloading all docs");
  let localMeta = await downloadAllDocs(repos);
  console.info("constructing plugin config");
  let plugins = buildPluginsConfig(localMeta);
  console.info("saving plugin config");
  await fs.writeFile(
    path.join(__dirname, "../data/repos/repos.json"),
    JSON.stringify(plugins, null, 2).replaceAll("\\\\", "/")
  );
  console.info("constructing metadata");
  for (let key of Object.keys(repos)) {
    // @ts-ignore this should work
    repos[key].branches = localMeta[key];
  }
  console.info("saving metadata");
  await fs.writeFile(
    path.join(__dirname, "../data/repos/meta.json"),
    JSON.stringify(repos, null, 2).replaceAll("\\\\", "/")
  )

})();

async function fetchAllMeta(): Promise<Record<string, {
  displayName: string,
  slug: slug,
  group: RepoGroups,
  defaultBranch: string,
  branches: string[]
}>> {
  let listForOrg = await octokit.rest.repos.listForOrg({
    org: ORGANIZATION,
    per_page: 100
  });

  let reqs = [];
  for (let {
    name: repoName,
    default_branch,
    description,
    private: isPrivate
  } of listForOrg.data) reqs.push((async () => {
    let branches = (await octokit.rest.repos.listBranches({
      owner: ORGANIZATION,
      repo: repoName
    })).data.map(entry => entry.name);

    let group = RepoGroups.findGroup(repoName);
    let displayName = repoName;
    if (group !== RepoGroups.OTHER) {
      displayName = displayName.slice(group.length + 1);
    }

    let sanitizedBranchNames = Object.fromEntries(branches.map(b => [
      sanitize(b.replaceAll("/", "")), b
    ]));

    return {
      displayName,
      slug: repoName,
      description,
      private: isPrivate,
      group,
      defaultBranch: default_branch,
      branches,
      sanitizedBranchNames
    };
  })())

  return Object.fromEntries((await Promise.all(reqs)).map(val => [val.slug, val]));
}

async function clearDataDir() {
  await fs.rm(path.join(__dirname, "../data/repos"), {force: true, recursive: true});
  await fs.mkdir(path.join(__dirname, "../data/repos"), {recursive: true});
}

async function downloadAllDocs(
  repoMeta: Awaited<ReturnType<typeof fetchAllMeta>>
) {
  let localMeta = Object.fromEntries(Object.entries(repoMeta).map(([key, val]) => {
    return [key, Object.fromEntries(val.branches.map(b => [b, {
      sanitizedName: sanitize(b.replaceAll("/", "")),
      hasDocs: false as boolean | string,
      hasDocsSidebar: undefined as undefined | string,
      hasStaticDocs: false as boolean | string,
      hasReadMe: false as boolean | string,
      hasApi: false as boolean | string
    }]))];
  }));
  let downloads = [];
  for (let data of Object.entries(repoMeta)) {
    let [name, {displayName, slug, defaultBranch, branches}] = data;
    for (let branch of branches) downloads.push((async () => {
      let {data} = await octokit.rest.repos.downloadZipballArchive({
        owner: ORGANIZATION,
        repo: name,
        ref: branch
      });
      if (!(data instanceof ArrayBuffer)) return;
      let zipInfo = await unzip(data);
      for (let entry of Object.values(zipInfo.entries)) {
        if (entry.name.endsWith("/")) continue;
        let pathFragments = entry.name.split("/");
        pathFragments.shift();
        let fileName = sanitizeFileName(pathFragments.pop());
        if (!(
          !pathFragments[0] ||
          pathFragments[0] === "docs" ||
          pathFragments[0] === "static_docs"
        )) continue;
        let localFilePath = path.join(
          __dirname,
          "../data/repos",
          sanitize(name),
          sanitize(branch),
          pathFragments.join("/"),
          fileName
        );

        await writeZipContent(localFilePath, fileName, entry);

        if (fileName.match(/(open)?api\.ya?ml/i)) localMeta[name][branch].hasApi = fileName;
        if (
          pathFragments[0] === "docs" &&
          !localMeta[name][branch].hasDocs &&
          fileName.endsWith(".md")
        ) localMeta[name][branch].hasDocs = [pathFragments.slice(1), fileName].flat().join("/");
        if (pathFragments[0] === "static_docs") localMeta[name][branch].hasStaticDocs = true;
        if (fileName.match(/readme/i)) localMeta[name][branch].hasReadMe = fileName;
        if (fileName.match(/sidebar[^/]+json/i)) localMeta[name][branch].hasDocsSidebar = fileName;
      }
    })());
  }
  await Promise.all(downloads);
  return localMeta;
}

function sanitizeFileName(fileName: string) {
  // if (fileName.endsWith(".md")) {
  //   return fileName.match(/_*(?<base>[^_].+[^_])_*\.md/).groups.base + ".md";
  // }
  return fileName;
}


async function writeZipContent(filePath: string, fileName: string, entry: ZipEntry) {
  if (fileName.match(/readme/i)) {
    let readmeFilePath = filePath.split(fileName)[0] + "/readme/" + fileName;
    await fs.mkdir(path.dirname(readmeFilePath), {recursive: true});
    // sanitize html in README
    await fs.writeFile(
      readmeFilePath,
      (await entry.text())
        .replaceAll("<br>", "<br/>")
        .replaceAll("<hr>", "<hr/>")
    );
  }
  else {
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, Buffer.from(await entry.arrayBuffer()));
  }
}

function buildPluginsConfig(
  docsMeta: Awaited<ReturnType<typeof downloadAllDocs>>
) {
  function sanitizeId(id: string): string {
    return sanitize(
      id
        .replaceAll(":", "-")
        .replaceAll(".", "-")
    );
  }

  let plugins = [];
  for (let [name, branches] of Object.entries(docsMeta)) {
    for (let [branch, meta] of Object.entries(branches)) {
      if (meta.hasReadMe) {
        plugins.push(["@docusaurus/plugin-content-pages", {
          path: path.join(
            "../data/repos",
            sanitize(name),
            sanitize(branch),
            "readme"
          ),
          routeBasePath: path.join(sanitize(name), sanitize(branch), "readme"),
          include: [meta.hasReadMe],
          id: sanitizeId(`readme::${name}::${branch}`)
        }]);
      }

      if (meta.hasDocs) {
        plugins.push(["@docusaurus/plugin-content-docs", {
          path: path.join(
            "../data/repos",
            sanitize(name),
            sanitize(branch),
            "docs"
          ),
          // sidebarPath: meta.hasDocsSidebar ? path.join(
          //   "../data/repos",
          //   sanitize(name),
          //   sanitize(branch),
          //   "docs",
          //   meta.hasDocsSidebar
          // ) : undefined,
          include: ["**/*.md"],
          exclude: [],
          routeBasePath: path.join(sanitize(name), sanitize(branch), "docs"),
          id: sanitizeId(`docs::${name}::${branch}`)
        }]);
      }

      if (meta.hasApi) {
        plugins.push(["docusaurus-plugin-redoc", {
          spec: path.join(
            "../data/repos",
            sanitize(name),
            sanitize(branch),
            meta.hasApi as string
          ),
          route: path.join(sanitize(name), sanitize(branch), "api"),
          id: sanitizeId(`api::${name}::${branch}`)
        }]);
      }

      if (meta.hasStaticDocs) {
        plugins.push(["@docusaurus/plugin-content-pages", {
          path: "src/frame",
          routeBasePath: path.join(sanitize(name), sanitize(branch)),
          id: sanitizeId(`static_docs::${name}::${branch}`)
        }])
      }
    }
  }
  return plugins;
}
