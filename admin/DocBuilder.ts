import AwaitLock from "await-lock";
import {spawn} from "child_process";
import {join} from "path";

/** Enum displaying why the build failed. */
export enum BuildIssue {
  SCRIPT,
  LOCK
}

/** Wrapper class for the "npm run build" command. */
export class DocBuilder {

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
   * Function to build the new docs.
   *
   * If one builder is currently running, {@link BuildIssue.LOCK} will be
   * returned as rejection.
   *
   * If the command had an issue {@link BuildIssue.SCRIPT} will be returned as
   * rejection.
   */
  build() {
    return new Promise<void>((resolve, reject) => {
      if (this.lock.tryAcquire()) {
        let fetcher = spawn(
          this.npmCmd,
          ["run", "build"],
          {cwd: join(__dirname, "../")}
        );
        fetcher.once("exit", code => {
          if (code == 0) {
            resolve();
            this.lock.release();
            return;
          }
          reject(BuildIssue.SCRIPT);
          this.lock.release();
          return;
        });
        return;
      }
      reject(BuildIssue.LOCK);
    });
  }

}
