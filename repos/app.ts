import {Octokit} from "@octokit/rest";
import fsPromises from "fs/promises";
import fs from "fs";
import path from "path";
import {unzip, ZipEntry} from "unzipit";
import {fileURLToPath} from "url";
import sanitize from "sanitize-filename";

const USER_AGENT = "@wisdom-oss/docs-tool";
const ORGANIZATION = "wisdom-oss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const octokit = new Octokit({
  auth: process.env["GITHUB_SECRET"],
  userAgent: USER_AGENT
});

enum RepoGroups {
  SERVICE = "service",
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
  await fsPromises.writeFile(
    path.join(__dirname, "../data/repos/repos.json"),
    JSON.stringify(plugins, null, 2).replaceAll("\\\\", "/")
  );
  console.info("constructing metadata");
  for (let key of Object.keys(repos)) {
    // @ts-ignore this should work
    repos[key].branches = localMeta[key];
  }
  console.info("saving metadata");
  await fsPromises.writeFile(
    path.join(__dirname, "../data/repos/meta.json"),
    JSON.stringify(repos, null, 2).replaceAll("\\\\", "/")
  );
  console.info("copying global docs list");
  copyMainDocsList(repos);
  console.info("done");
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
  await fsPromises.rm(path.join(__dirname, "../data/repos"), {force: true, recursive: true});
  await fsPromises.mkdir(path.join(__dirname, "../data/repos"), {recursive: true});
}

async function downloadAllDocs(
  repoMeta: Awaited<ReturnType<typeof fetchAllMeta>>
) {
  let localMeta = Object.fromEntries(Object.entries(repoMeta).map(([key, val]) => {
    return [key, Object.fromEntries(val.branches.map(b => [b, {
      sanitizedName: sanitize(b.replaceAll("/", "")),
      readmes: [] as string[],
      hasReadMe: false as boolean | string,
      hasDocs: false as boolean | string,
      hasDocsSidebar: undefined as undefined | string,
      hasStaticDocs: false as boolean | string,
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
        let fileName = pathFragments.pop();
        if (!(
          !pathFragments[0] ||
          pathFragments[0] === "docs" ||
          pathFragments[0] === "static_docs" ||
          entry.name.match(/readme/i) // keep all readmes
        ) && name !== "docs") continue; // completely keep "docs" repo
        let localFilePath = path.join(
          __dirname,
          "../data/repos",
          sanitize(name),
          sanitize(branch),
          pathFragments.join("/"),
          fileName
        );

        await writeZipContent(localFilePath, fileName, entry);

        if (name === "docs") continue; // skip meta for "docs" repo
        if (fileName.match(/(open)?api\.ya?ml/i)) localMeta[name][branch].hasApi = fileName;
        if (
          pathFragments[0] === "docs" &&
          !localMeta[name][branch].hasDocs &&
          fileName.endsWith(".md")
        ) localMeta[name][branch].hasDocs = [pathFragments.slice(1), fileName].flat().join("/");
        if (pathFragments[0] === "static_docs") localMeta[name][branch].hasStaticDocs = true;
        if (fileName.match(/readme/i)) {
          localMeta[name][branch].readmes.push(
            pathFragments.concat([fileName]).join("/")
          );
          if (!localMeta[name][branch].hasReadMe) {
            localMeta[name][branch].hasReadMe = fileName
          }
        }
        if (fileName.match(/sidebar[^/]+json/i)) localMeta[name][branch].hasDocsSidebar = fileName;
      }
    })());
  }
  await Promise.all(downloads);
  return localMeta;
}

async function writeZipContent(filePath: string, fileName: string, entry: ZipEntry) {
  const entryPath = entry.name.split("/").slice(1).join("/");
  const entryIsMd = fileName.endsWith(".md");
  const entryIsReadme = !!entryPath.match(/readme\.md$/i);
  const entryIsDocs = !!entry.name.match(new RegExp(
    `^${ORGANIZATION}-docs-[a-zA-Z0-9]+/.*`
  ));

  const normalizedFilePath = filePath.split(path.sep).join("/");

  let writePath = filePath;
  if (entryIsReadme && !entryIsDocs) {
    writePath = normalizedFilePath.split(entryPath)[0] + "readme/" + entryPath;
  }
  let content: Buffer | string = Buffer.from(await entry.arrayBuffer());
  if (entryIsMd) content = rebuildKnownLink(await entry.text())
    .replaceAll("<br>", "<br/>")
    .replaceAll("<hr>", "<hr/>");

  await fsPromises.mkdir(path.dirname(writePath), {recursive: true});
  await fsPromises.writeFile(writePath, content);
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
      // handle "docs" repo differently
      if (name == "docs") {
        let docsList = JSON.parse(fs.readFileSync(
          `../data/repos/docs/${sanitize(branch)}/docs.json`,
          "utf-8"
        ));
        for (let {path: localPath, label, description, sidebar} of docsList) {
          plugins.push(["@docusaurus/plugin-content-docs", {
            path: `../data/repos/docs/${sanitize(branch)}/${localPath}`,
            routeBasePath: path.join(sanitize(name), sanitize(branch), "docs", localPath),
            sidebarPath: `../data/repos/docs/${sanitize(branch)}/${localPath}/${sidebar}`,
            sidebarCollapsed: false,
            include: ["**/*.md"],
            id: sanitizeId(`docs::${name}::${branch}::${localPath}`)
          }])
        }

        // ignore other features for the "docs" repo
        continue;
      }

      if (meta.hasReadMe) {
        plugins.push(["@docusaurus/plugin-content-pages", {
          path: path.join(
            "../data/repos",
            sanitize(name),
            sanitize(branch),
            "readme"
          ),
          routeBasePath: path.join(sanitize(name), sanitize(branch), "readme"),
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

function copyMainDocsList(repoMeta: Awaited<ReturnType<typeof fetchAllMeta>>) {
  fs.copyFileSync(
    path.join(
      __dirname,
      "../data/repos/docs",
      repoMeta.docs.defaultBranch,
      "docs.json"
    ),
    path.join(
      __dirname,
      "../data/repos/docs.json"
    )
  );
}

function rebuildKnownLink(entryText: string): string {
  let linksReplace = entryText
    .replaceAll(
      new RegExp(
        `(?:https://)?(?:www\\.)?github.com/${ORGANIZATION}/([^/]+)/blob/([^/]+)/(.+?)(?:\\.md)`,
        "gi"
      ),
      "/$1/$2/$3"
    );

  let output = [];
  for (let line of linksReplace.split("\n")) {
    if (!line.startsWith("#")) {
      output.push(line);
      continue;
    }

    output.push(line.replaceAll(
      /([^!])\[([^[\]]+)\]\(([^()]+?)(?:\.md)?\)/gi,
      '$1<a href="$3">$2</a>'
    ));
  }

  return output.join("\n");
}
