import {fileURLToPath} from "url";
import {dirname, join} from "path";
import {spawn} from "child_process";
import isWindows from "is-windows";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let npm = isWindows() ? "npm.cmd" : "npm";

export default function startStaticFileserver() {
  let fileServer = spawn(npm, ["run", "serve-static"], {
    cwd: join(__dirname, "../..")
  });
  fileServer.stdout.setEncoding("utf8");
  fileServer.stdout.on("data", data => {
    if (!data) return;
    for (let date of data.split("\n")) {
      if (!date.trim().length) continue;
      console.info("[StaticFileServer] " + date);
    }
  })
  fileServer.stderr.setEncoding("utf8");
  fileServer.stderr.on("data", data => {
    if (!data) return;
    for (let date of data.split("\n")) {
      if (!date.trim().length) continue;
      console.error("[StaticFileServer] " + date);
    }
  });
  return fileServer
}
