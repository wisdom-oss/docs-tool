import {spawn} from "child_process";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import isWindows from "is-windows";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let npm = isWindows() ? "npm.cmd" : "npm";

export default function updateRepos() {
  return new Promise((resolve, reject) => {
    let updater = spawn(npm, ["run", "start"], {
      cwd: join(__dirname, "../../repos")
    });
    updater.stdout.setEncoding("utf-8");
    updater.stdout.on("data", data => {
      for (let date of data.split("\n")) {
        if (!date.trim().length) continue;
        console.info("[ReposUpdater] " + date);
      }
    });
    updater.stderr.setEncoding("utf8");
    updater.stderr.on("data", data => {
      for (let date of data.split("\n")) {
        if (!date.trim().length) continue;
        console.error("[ReposUpdater] " + date);
      }
    })
    updater.on("close", code => {
      if (code) return reject();
      resolve();
    })
  });
}
