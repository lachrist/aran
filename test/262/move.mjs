import { pathToFileURL } from "node:url";
import { argv, stderr, stdout } from "node:process";
import {
  scrape,
  inspectErrorMessage,
  inspectErrorName,
} from "./util/index.mjs";
import { parseCursor, stringifyCursor } from "./cursor.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { home, root } from "./home.mjs";
import { showTargetPath, toMainPath } from "./fetch.mjs";
import { compileStage } from "./stage.mjs";
import { isExcludeResult } from "./result.mjs";

const {
  process,
  URL,
  JSON: { stringify },
} = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<0 | 1>}
 */
const main = async (argv) => {
  if (argv.length !== 1) {
    stderr.write(
      "usage: node --experimental-vm-modules --expose-gc test/262/move.mjs <cursor>\n",
    );
    return 1;
  } else {
    const persistent = pathToFileURL(argv[0]);
    /** @type {import("./cursor").Cursor} */
    let cursor;
    try {
      cursor = parseCursor(await readFile(persistent, "utf8"));
    } catch (error) {
      stderr.write(
        `could not read cursor file at ${persistent} >> ${inspectErrorMessage(error)}\n`,
      );
      return 1;
    }
    const exec = await compileStage(cursor.stage, {
      memoization: "lazy",
      record: null,
    });
    let index = 0;
    /** @type {import("./fetch").TestPath | null} */
    let path = null;
    let done = false;
    let ongoing = false;
    const onUncaughtException = (/** @type {unknown} */ error) => {
      stdout.write(
        `uncaught >> ${inspectErrorName(error)} >> ${inspectErrorMessage(error)}\n`,
      );
    };
    process.addListener("uncaughtException", onUncaughtException);
    let sigint = false;
    const onSigint = () => {
      sigint = true;
    };
    process.addListener("SIGINT", onSigint);
    try {
      for await (const url of scrape(new URL("test/", home))) {
        if (sigint) {
          return 1;
        }
        path = toMainPath(url, home);
        if (path !== null) {
          if ((!ongoing && path === cursor.path) || index === cursor.index) {
            ongoing = true;
          }
          if (ongoing) {
            stdout.write(`${index} ${showTargetPath(path, home, root)}\n`);
            for (const [specifier, result] of await exec(path)) {
              if (!isExcludeResult(result)) {
                const { actual, expect } = result;
                if ((actual === null) !== (expect.length === 0)) {
                  stderr.write(
                    stringify({ specifier, actual, expect }, null, 2),
                  );
                  stderr.write("\n");
                  return 1;
                }
              }
            }
          }
          index += 1;
        }
      }
      done = true;
      return 0;
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
      process.removeListener("SIGINT", onSigint);
      await writeFile(
        persistent,
        stringifyCursor({
          stage: cursor.stage,
          index: done ? null : index,
          path: done ? null : path,
        }),
        "utf8",
      );
    }
  }
};

process.exitCode = await main(argv.slice(2));
