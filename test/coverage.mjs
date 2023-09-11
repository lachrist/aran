/* eslint-disable import/no-nodejs-modules */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */

import { spawn } from "node:child_process";
import { ordering } from "./ordering.mjs";

const { Error, Promise } = globalThis;

/** @type {(path: string) => Promise<{signal: string | null, status: number | null}>} */
const testAsync = async (path) => {
  const child = spawn(
    "npx",
    [
      "c8",
      "--100",
      "--include",
      `lib/${path}.mjs`,
      "--",
      "node",
      `test/lib/${path}.mjs`,
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

for (const path of ordering) {
  console.log(`${path}...`);
  const { signal, status } = await testAsync(path);
  if (signal !== null) {
    throw new Error(`Signal ${signal}`);
  }
  if (status !== 0) {
    throw new Error(`Status ${status}`);
  }
}
