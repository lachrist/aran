/* eslint-disable no-console */
/* eslint-disable import/no-nodejs-modules */
/* eslint-disable no-restricted-syntax */

import { readFile } from "node:fs/promises";

const isNotEmptyString = (string) => string !== "";

for (const path of (await readFile("./test/ordering", "utf8"))
  .split("\n")
  .filter(isNotEmptyString)) {
  console.log(`${path}...`);
  await import(new URL(`./lib/${path}.mjs`, import.meta.url));
}
