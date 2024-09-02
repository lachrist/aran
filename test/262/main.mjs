import { spawn } from "node:child_process";

const { undefined, Promise, Error } = globalThis;

/**
 * @type {(
 *   stage: import("./stage").StageName,
 * ) => Promise<void>}
 */
const exec = (stage) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      ["--experimental-vm-modules", "--expose-gc", "test/262/exec.mjs", stage],
      {
        stdio: ["ignore", "inherit", "inherit"],
      },
    );
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal === null) {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`${stage} failure code: ${code}`));
        }
      } else {
        reject(new Error(`${stage} kill signal: ${signal}`));
      }
    });
  });

/**
 * @type {import("./stage").StageName[]}
 */
const stages = [
  "identity",
  "parsing",
  "bare-basic-flexible",
  "bare-basic-standard",
  "bare-patch-flexible",
  "bare-patch-standard",
  "bare-weave-flexible",
  "bare-weave-standard",
  "full-basic-flexible",
  "full-basic-standard",
  "state-basic-standard",
];

for (const stage of stages) {
  await exec(stage);
}
