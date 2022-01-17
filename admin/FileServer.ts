import AwaitLock from "await-lock";
import {spawn, ChildProcess} from "child_process";
import {join} from "path";
import kill from "tree-kill";

/**
 * Class for wrapping the Docusaurus file server with basic methods.
 *
 * Basically just runs the "npm run serve" command.
 */
export default class FileServer {

  /** The child process running the serve command. */
  private childProcess: ChildProcess;
  /* The lock for restarting the server. */
  private lock: AwaitLock;

  /**
   * Constructor.
   *
   * Will automatically start the file server.
   * @param npmCmd The command to use for "npm", Windows needs another input here
   * @private
   */
  constructor(private npmCmd: string) {
    this.lock = new AwaitLock();
    this.start();
  }

  /**
   * Starts the file server with the "npm run serve" command.
   * @private
   */
  private start() {
    console.log("[FileServer] starting...");
    this.childProcess = spawn(
      this.npmCmd,
      ["run", "serve"],
      {cwd: join(__dirname, "../")},
    );
  }

  /**
   * Restarts the file server, if no restart is currently in process.
   */
  restart(): Promise<FileServer> {
    return new Promise((resolve, reject) => {
      if (this.lock.tryAcquire()) {
        console.log("[FileServer] initiated restart");
        this.childProcess.once("exit", () => {
          console.log("[FileServer] server exited");
          this.start();
          this.lock.release();
          resolve(this);
        });

        // use tree kill since Windows is weird
        kill(this.childProcess.pid);
        return;
      }
      console.warn("[FileServer] already restarting")
      reject();
    });
  }
}
