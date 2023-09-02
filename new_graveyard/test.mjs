/* eslint-disable no-console */
/* eslint-disable import/no-nodejs-modules */
/* eslint-disable no-restricted-syntax */

import { readFile } from "node:fs/promises";

const { URL, String } = globalThis;

/** @type {((string: string) => boolean)} */
const isNotEmptyString = (string) => string !== "";

for (const path of (await readFile("./lib/ordering", "utf8"))
  .split("\n")
  .filter(isNotEmptyString)) {
  console.log(`${path}...`);
  await import(String(new URL(`./${path}.test.mjs`, import.meta.url)));
}
