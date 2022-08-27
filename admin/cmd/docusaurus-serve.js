import {fileURLToPath} from "url";
import {dirname, join} from "path";
import {spawn} from "child_process";
import isWindows from "is-windows";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let npm = isWindows() ? "npm.cmd" : "npm";

export default function startDocusaurusServer() {
  let docServer = spawn(npm, ["run", "serve"], {
    cwd: join(__dirname, "../../docusaurus")
  });
  docServer.stdout.setEncoding("utf8");
  docServer.stdout.on("data", data => {
    if (!data) return;
    for (let date of data.split("\n")) {
      if (!date.trim().length) continue;
      console.info("[Docusaurus:Serve] " + date);
    }
  })
  docServer.stderr.setEncoding("utf8");
  docServer.stderr.on("data", data => {
    if (!data) return;
    for (let date of data.split("\n")) {
      if (!date.trim().length) continue;
      console.error("[Docusaurus:Serve] " + date);
    }
  });
  return docServer
}
