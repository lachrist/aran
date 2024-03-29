/* eslint-disable local/no-function */

import { readdir, stat } from "node:fs/promises";

const { URL } = globalThis;

/**
 * @type {(directory: URL) => AsyncIterable<URL>}
 */
export const scrape = async function* (parent) {
  for (const name of (await readdir(parent)).sort()) {
    const child = new URL(name, parent);
    if ((await stat(child)).isDirectory()) {
      yield* scrape(new URL(`${name}/`, parent));
    } else {
      yield child;
    }
  }
};
