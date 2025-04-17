import { spawn as spawnNode } from "node:child_process";

const { Error, Promise } = globalThis;

/**
 * @type {(
 *   exec: string,
 *   argv: string[],
 * ) => Promise<void>}
 */
export const spawn = (exec, argv) =>
  new Promise((resolve, reject) => {
    const child = spawnNode(exec, argv, {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      if (signal !== null) {
        reject(new Error(`${exec} >> ${signal}`));
      } else if (status !== 0) {
        reject(new Error(`${exec} >> ${status}`));
      } else {
        resolve();
      }
    });
  });
