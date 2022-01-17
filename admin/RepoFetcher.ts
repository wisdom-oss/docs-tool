import AwaitLock from "await-lock";
import {spawn} from "child_process";
import {join} from "path";

/** Enum displaying why the fetch failed. */
export enum FetchIssue {
  SCRIPT,
  LOCK
}

/** Wrapper class for the "npm run update-repos" command. */
export default class RepoFetcher {

  /** Lock to only run one command at a time. */
  private lock: AwaitLock;

  /**
   * Constructor.
   * @param npmCmd Which command to call "npm"
   */
  constructor(private npmCmd: string) {
    this.lock = new AwaitLock();
  }

  /**
   * Function to fetch the new repos.
   *
   * If one fetcher is currently running, {@link FetchIssue.LOCK} will be
   * returned as rejection.
   *
   * If the command had an issue {@link FetchIssue.SCRIPT} will be returned as
   * rejection.
   */
  fetchRepos() {
    return new Promise<void>((resolve, reject) => {
      if (this.lock.tryAcquire()) {
        let fetcher = spawn(
          this.npmCmd,
          ["run", "update-repos"],
          {cwd: join(__dirname, "../")}
        );
        fetcher.once("exit", code => {
          if (code == 0) {
            resolve();
            this.lock.release();
            return;
          }
          reject(FetchIssue.SCRIPT);
          this.lock.release();
          return;
        });
        return;
      }
      reject(FetchIssue.LOCK);
    });
  }
}
