/**
 * Script to run an admin endpoint for updating the served files.
 */
import express, {Request} from "express";
import {readFileSync} from "fs";
import {join} from "path";
import {platform} from "process";

import FileServer from "./FileServer";
import RepoFetcher, {FetchIssue} from "./RepoFetcher";
import {DocBuilder, BuildIssue} from "./DocBuilder";
import AwaitLock from "await-lock";

const app = express();
const port = 3001;
const cmd = platform === "win32" ? "npm.cmd" : "npm";
const fileServer = new FileServer(cmd);
const adminToken = readFileSync(join(__dirname, "../.admin-token"), "utf-8").trim();
const repoFetcher = new RepoFetcher(cmd);
const docBuilder = new DocBuilder(cmd);

app.use((req, res, next) => {
  if (req.headers.authorization !== `token ${adminToken}`) {
    return res.sendStatus(401);
  }
  next();
});

let updateLock = new AwaitLock();
app.post("/update", async (req, res) => {
  if (updateLock.tryAcquire()) {
    try {
      await repoFetcher.fetchRepos();
    }
    catch (e) {
      switch (e) {
        case FetchIssue.SCRIPT:
          res.status(500).send("Fetching failed.");
          updateLock.release();
          return;
        case FetchIssue.LOCK:
          res.sendStatus(409);
          updateLock.release();
          return;
      }
    }

    try {
      await docBuilder.build();
    }
    catch (e) {
      switch (e) {
        case BuildIssue.SCRIPT:
          res.status(500).send("Building failed.");
          updateLock.release();
          return;
        case BuildIssue.LOCK:
          res.sendStatus(409);
          updateLock.release();
          return;
      }
    }

    res.sendStatus(200);
    updateLock.release();
    return;
  }
  res.sendStatus(409);
});

app.post("/restart", (req, res) => {
  fileServer.restart()
    .then(() => res.sendStatus(202))
    .catch(() => res.sendStatus(409));
});

app.listen(port, () => {
  console.log("[App] admin endpoint running at port " + port);
});
