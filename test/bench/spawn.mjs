import { spawn as spawnNode } from "node:child_process";

const { Promise } = globalThis;

/**
 * @type {(
 *   exec: string,
 *   argv: string[],
 * ) => Promise<{
 *   status: null | number;
 *   signal: null | string;
 * }>}
 */
export const spawn = (exec, argv) =>
  new Promise((resolve, reject) => {
    const child = spawnNode(exec, argv, {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      resolve({ status, signal });
    });
  });
