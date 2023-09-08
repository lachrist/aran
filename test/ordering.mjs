/* eslint-disable import/no-nodejs-modules */
/* eslint-disable no-restricted-syntax */

import { readFile } from "node:fs/promises";

const { URL } = globalThis;

/** @type {((string: string) => boolean)} */
const isNotEmptyString = (string) => string !== "";

export const ordering = (
  await readFile(new URL("./ordering", import.meta.url), "utf8")
)
  .split("\n")
  .filter(isNotEmptyString);
