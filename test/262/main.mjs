import { spawn } from "node:child_process";
import { STAGE_ENUM } from "./stage.mjs";

const {
  undefined,
  Promise,
  Error,
  Reflect: { ownKeys: listKey },
} = globalThis;

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

for (const stage of /** @type {import("./stage").StageName[]} */ (
  listKey(STAGE_ENUM)
)) {
  await exec(stage);
}
