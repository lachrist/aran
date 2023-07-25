/* eslint-disable */

import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const { URL } = globalThis;

/** @type {(string: string) => boolean} */
const isNotEmptyString = (string) => string !== "";

/** @type {(path: string) => Promise<{signal: string | null, status: number | null}>} */
const testAsync = async (path) => {
  const child = spawn(
    "npx",
    [
      "c8",
      "--include",
      `lib/${path}.mjs`,
      "--",
      "node",
      `lib/${path}.test.mjs`,
    ],
    { stdio: "inherit" },
  );
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      resolve({ signal, status });
    });
  });
};

/** @type {(paths: string[]) => Promise<void>} */
const testAllAsync = async (paths) => {
  for (const path of paths) {
    console.log(`${path}...`);
    const { signal, status } = await testAsync(path);
    if (signal !== null) {
      throw new Error(`Signal ${signal}`);
    }
    if (status !== 0) {
      throw new Error(`Status ${status}`);
    }
  }
};

(async () => {
  const paths = await readFile("./lib/ordering", "utf8");
  await testAllAsync(paths.split("\n").filter(isNotEmptyString));
})();
