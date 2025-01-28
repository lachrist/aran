import { spawn } from "node:child_process";
import { isStageName } from "../staging/stage-name-predicate.mjs";
import { argv, stdout, stderr } from "node:process";

const { Date, Promise, Error, setTimeout, process } = globalThis;

/**
 * @type {(
 *   stage: import("../staging/stage-name").StageName,
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
 * ) => Promise<null | string>}
 */
const main = async (argv) => {
  if (argv.length === 0) {
    return "usage: node test/262/batch.mjs <stage>...\n";
  }
  if (!argv.every(isStageName)) {
    return `invalid stage names: ${argv.filter((arg) => !isStageName(arg))}\n`;
  }
  /** @type {[import("../staging/stage-name").StageName, number][]} */
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
  return null;
};

{
  const status = await main(argv.slice(2));
  if (status !== null) {
    stderr.write(status);
    process.exitCode ||= 1;
  }
}
