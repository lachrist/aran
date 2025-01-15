import { open } from "node:fs/promises";
import { inspectErrorMessage, inspectErrorName } from "../util/index.mjs";
import { argv, stdout, stderr } from "node:process";
import { compileStage, isStageName } from "../staging/index.mjs";
import { isExcludeResult, packResult, toTestSpecifier } from "../result.mjs";
import { enumTestCase } from "../catalog/index.mjs";

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
        record: null,
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
      const prod_handle = await open(
        new URL(`../staging/prod/${stage_name}.jsonl`, import.meta.url),
        "w",
      );
      const fail_handle = await open(
        new URL(`../staging/fail/${stage_name}.jsonl`, import.meta.url),
        "w",
      );
      const prod_stream = prod_handle.createWriteStream({ encoding: "utf8" });
      const fail_stream = fail_handle.createWriteStream({ encoding: "utf8" });
      try {
        for await (const test of enumTestCase()) {
          if (sigint) {
            return 1;
          }
          if (index % 100 === 0) {
            stdout.write(`${index}\n`);
          }
          const result = await exec(test);
          prod_stream.write(JSON.stringify(packResult(result)) + "\n");
          if (isExcludeResult(result) || result.actual !== null) {
            fail_stream.write(
              toTestSpecifier(test.path, test.directive) + "\n",
            );
          }
          index += 1;
        }
        stdout.write(`Total time: ${Date.now() - start}ms\n`);
        return 0;
      } finally {
        process.removeListener("SIGINT", onSigint);
        process.removeListener("uncaughtException", onUncaughtException);
        await prod_handle.close();
        await fail_stream.close();
      }
    }
  }
};

process.exitCode = await main(argv.slice(2));
