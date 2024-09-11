/* eslint-disable local/strict-console */

import { pathToFileURL } from "node:url";
import { argv } from "node:process";
import { scrape } from "./scrape.mjs";
import { runTest } from "./test.mjs";
import { parseCursor, stringifyCursor } from "./cursor.mjs";
import { readFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { home } from "./home.mjs";
import { listTag } from "./tagging.mjs";
import { inspectErrorMessage, inspectErrorName } from "./error-serial.mjs";
import { listPrecursor } from "./precursor.mjs";
import {
  compileFetchHarness,
  compileFetchTarget,
  resolveTarget,
  toTargetPath,
} from "./fetch.mjs";
import { loadStage } from "./stage.mjs";

const { console, process, URL } = globalThis;

const persistent = pathToFileURL(argv[2]);

const cursor = parseCursor(await readFile(persistent, "utf8"));

const stage = await loadStage(cursor.stage);

let index = 0;

/** @type {import("./fetch").TargetPath | null} */
let path = null;

let ongoing = false;

process.on("uncaughtException", (error, _origin) => {
  console.log(error);
  console.log(
    `Uncaught >> ${inspectErrorName(error)}: ${inspectErrorMessage(error)}`,
  );
});

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("exit", () => {
  if (ongoing) {
    writeFileSync(
      persistent,
      stringifyCursor({
        stage: cursor.stage,
        index,
        path,
      }),
      "utf8",
    );
  }
});

const fetchHarness = compileFetchHarness(home);

const fetchTarget = compileFetchTarget(home);

for await (const url of scrape(new URL("test/", home))) {
  path = toTargetPath(url, home);
  if (path !== null) {
    if ((!ongoing && path === cursor.path) || index === cursor.index) {
      ongoing = true;
    }
    if (ongoing) {
      if (
        listTag(stage.exclude, path).length === 0 &&
        listPrecursor(stage.precursor, path).length === 0
      ) {
        console.log(index, path);
        const { metadata, outcome } = await runTest(path, {
          resolveTarget,
          fetchTarget,
          fetchHarness,
          instrument: stage.instrument,
          setup: stage.setup,
        });
        const tags = [
          ...listTag(stage.negative, path),
          ...(outcome.type === "failure"
            ? stage.listLateNegative(path, metadata, outcome.data)
            : []),
        ];
        if ((tags.length === 0) !== (outcome.type === "success")) {
          console.log({ tags, outcome });
          process.exit(1);
        }
      }
    }
    index += 1;
  }
}

writeFileSync(
  persistent,
  stringifyCursor({
    stage: cursor.stage,
    index: null,
    path: null,
  }),
  "utf8",
);

ongoing = false;
