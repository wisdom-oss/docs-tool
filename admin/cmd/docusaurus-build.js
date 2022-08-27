import {spawn} from "child_process";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import isWindows from "is-windows";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let npm = isWindows() ? "npm.cmd" : "npm";

export default function buildDocs() {
  return new Promise((resolve, reject) => {
    let builder = spawn(npm, ["run", "build"], {
      cwd: join(__dirname, "../../docusaurus")
    });
    builder.stdout.setEncoding("utf-8");
    builder.stdout.on("data", data => {
      if (!data) return;
      for (let date of data.split("\n")) {
        if (!date.trim().length) continue;
        console.info("[Docusaurus:Build] " + date);
      }
    });
    builder.stderr.setEncoding("utf8");
    builder.stderr.on("data", data => {
      if (!data) return;
      for (let date of data.split("\n")) {
        if (!date.trim().length) continue;
        console.error("[Docusaurus:Build] " + date);
      }
    })
    builder.on("close", code => {
      if (code) return reject();
      resolve();
    })
  });
}
