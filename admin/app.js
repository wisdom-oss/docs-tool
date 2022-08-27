import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {spawn} from "child_process";
import startCaddy from "./cmd/caddy.js";
import updateRepos from "./cmd/repos.js";
import startStaticFileserver from "./cmd/static.js";
import startDocusaurusServer from "./cmd/docusaurus-serve.js";
import buildDocs from "./cmd/docusaurus-build.js";
import AwaitLock from "await-lock";
import kill from "kill-with-style";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const lock = new AwaitLock.default();

lock.tryAcquire();
let caddy = startCaddy();
let staticFileServer;
let docusaurusServer;
(async () => {
  await updateRepos();
  staticFileServer = startStaticFileserver();
  await buildDocs();
  docusaurusServer = startDocusaurusServer();

  console.info("[Admin] initial build done");
  lock.release();
})();

const app = express();

app.get(/admin.*/, (req, res) => {
  res.sendStatus(405);
});

app.put(/admin.*/, async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
    console.warn(
      "[Admin] request denied with auth header: " +
      req.headers.authorization
    );
    return res.sendStatus(401);
  }

  if (lock.tryAcquire()) {
    try {
      console.info("[Admin] killing servers now");

      await new Promise((resolve, reject) => kill(
        staticFileServer.pid,
        {
          signal: ["SIGINT", "SIGKILL"],
          retryCount: 5,
          retryInterval: 10000,
          timeout: 11000
        },
        err => {
          if (err) return reject(err);
          resolve();
        })
      );

      await new Promise((resolve, reject) => kill(
        docusaurusServer.pid,
        {
          signal: ["SIGINT", "SIGKILL"],
          retryCount: 5,
          retryInterval: 10000,
          timeout: 11000
        },
        err => {
          if (err) return reject(err);
          resolve();
        })
      );

      console.info("[Admin] updating docs");
      await updateRepos();
      staticFileServer = startStaticFileserver();
      await buildDocs();
      docusaurusServer = startDocusaurusServer();

      console.info("[Admin] update done");
      res.sendStatus(200);
    }
    catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
    finally {
      lock.release();
    }
  }
  else res.sendStatus(202);
});

app.listen(3003);
