import {spawn} from "child_process";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import isWindows from "is-windows";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let npm = isWindows() ? "npm.cmd" : "npm";

export default function startCaddy() {
  let caddy = spawn(npm, ["run", "caddy"], {
    cwd: join(__dirname, "../..")
  });
  caddy.stderr.setEncoding("utf8");
  caddy.stderr.on("data", data => {
    if (!data) return;
    for (let date of data.split("\n")) {
      if (!date.trim().length) continue;
      try {
        let {level, msg, ...rest} = JSON.parse(date.trim());
        console.info([
          "[Caddy]",
          `[${level.toUpperCase()}]`,
          msg,
          JSON.stringify(rest)
        ].join(" "));
      }
      catch (e) {
        console.info("[Caddy] " + date);
      }
    }
  });
  return caddy;
}
