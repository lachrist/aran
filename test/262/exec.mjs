import { open } from "node:fs/promises";
import { scrape } from "./scrape.mjs";
import { argv, stdout, stderr } from "node:process";
import { home } from "./home.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { compileStage, isStageName } from "./stage.mjs";
import { toMainPath } from "./fetch.mjs";
import { packResultEntry } from "./result.mjs";

const { Date, process, URL, JSON } = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<0 | 1>}
 */
const main = async (argv) => {
  if (argv.length !== 1) {
    stderr.write(
      "usage: node --experimental-vm-modules --expose-gc test/262/exec.mjs <stage>\n",
    );
    return 1;
  } else {
    const stage_name = argv[0];
    if (!isStageName(stage_name)) {
      stderr.write(`invalid stage: ${stage_name}\n`);
      return 1;
    } else {
      const start = Date.now();
      const exec = await compileStage(stage_name, {
        memoization: "eager",
        recording: false,
      });
      let sigint = false;
      const onSigint = () => {
        sigint = true;
      };
      process.addListener("SIGINT", onSigint);
      const onUncaughtException = (/** @type {unknown} */ error) => {
        stderr.write(
          `uncaught >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}\n`,
        );
      };
      process.addListener("uncaughtException", onUncaughtException);
      let index = 0;
      const handle = await open(
        new URL(`stages/${stage_name}.jsonl`, import.meta.url),
        "w",
      );
      const stream = handle.createWriteStream({
        encoding: "utf8",
      });
      try {
        for await (const url of scrape(new URL("test/", home))) {
          if (sigint) {
            return 1;
          }
          if (index % 100 === 0) {
            stdout.write(`${index}\n`);
          }
          const path = toMainPath(url, home);
          if (path !== null) {
            for (const entry of await exec(path)) {
              stream.write(JSON.stringify(packResultEntry(entry)) + "\n");
            }
            index += 1;
          }
        }
        stdout.write(`Total time: ${Date.now() - start}ms\n`);
        return 0;
      } finally {
        process.removeListener("SIGINT", onSigint);
        process.removeListener("uncaughtException", onUncaughtException);
        await handle.close();
      }
    }
  }
};

process.exitCode = await main(argv.slice(2));
