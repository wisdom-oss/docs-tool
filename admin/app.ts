import express from "express";
import {spawn} from "child_process";
import {join} from "path";
import {platform} from "process";
import kill from "tree-kill";
import fetchRepo from "../scripts/fetchRepo";

const app = express();
const port = 3001;
const cmd = platform === "win32" ? "npm.cmd" : "npm";
const cmdOptions = {
  cwd: join(__dirname, "../")
};
let fileServer = null;

app.get("/update", (req, res) => {
  let {token} = req.query;
  if (token !== "lol") {
    res.status(401).end();
    return;
  }
  stopFileServer();
  let updater = spawn(cmd, ["run", "update-repos"], cmdOptions);
  updater.once("exit", () => {
    let builder = spawn(cmd, ["run", "build"]);
    builder.once("exit", startFileServer);
  });
  res.end();
});

function startFileServer() {
  fileServer = spawn(cmd, ["run", "serve"], cmdOptions);
  console.log("started file server");
}

function stopFileServer() {
  kill(fileServer.pid);
  return "test";
}

startFileServer();
app.listen(port, () => {
  console.log("Admin endpoint running at port " + port);
});
