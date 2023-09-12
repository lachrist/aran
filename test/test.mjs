/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */

import { ordering } from "./ordering.mjs";

const { URL, String } = globalThis;

for (const path of ordering) {
  console.log(`${path}...`);
  await import(String(new URL(`../lib/${path}.test.mjs`, import.meta.url)));
}
