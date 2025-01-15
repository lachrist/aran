import { spawn } from "node:child_process";
import { isStageName } from "./stagging/index.mjs";
import { argv, stdout } from "node:process";

const { Date, Promise, Error, setTimeout } = globalThis;

/**
 * @type {(
 *   stage: import("./stagging/stage-name").StageName,
 * ) => Promise<number>}
 */
const exec = (stage) =>
  new Promise((resolve, reject) => {
    const start = Date.now();
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
          resolve(Date.now() - start);
        } else {
          reject(new Error(`${stage} failure code: ${code}`));
        }
      } else {
        reject(new Error(`${stage} kill signal: ${signal}`));
      }
    });
  });

/**
 * @type {(
 *   argv: string[]
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length === 0) {
    stdout.write("usage: node test/262/batch.mjs <stage>...\n");
  } else {
    if (argv.every(isStageName)) {
      /** @type {[import("./stagging/stage-name").StageName, number][]} */
      const times = [];
      for (const stage of argv) {
        stdout.write(`executing ${stage}...\n`);
        // Let the system do some cleanup.
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
        times.push([stage, await exec(stage)]);
      }
      for (const [stage, time] of times) {
        stdout.write(`${stage}: ${time}ms\n`);
      }
    } else {
      for (const arg of argv) {
        if (!isStageName(arg)) {
          stdout.write(`invalid stage name: ${arg}\n`);
        }
      }
    }
  }
};

await main(argv.slice(2));
