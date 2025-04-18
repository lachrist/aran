import { writeFileSync } from "node:fs";
import { format } from "./format.mjs";
import { readdir, unlink } from "node:fs/promises";
import { stdout } from "node:process";
import { ROOT } from "../layout.mjs";

const { URL, performance, Math } = globalThis;

/**
 * @type {(
 *   directory: URL,
 * ) => Promise<void>}
 */
export const cleanup = async (directory) => {
  for (const filename of await readdir(directory)) {
    if (filename !== ".gitignore") {
      await unlink(new URL(filename, directory));
    }
  }
};

/**
 * @type {() => string}
 */
const generateUniqueIdentifier = () =>
  `${Math.floor(1e3 * performance.now()).toString(32)}-${Math.floor(
    1e9 * Math.random(),
  ).toString(32)}`;

/**
 * @type {(
 *   file: import("../util/file.d.ts").File,
 *   directory: URL,
 * ) => import("../util/file.d.ts").File}
 */
export const record = ({ path, content: content1 }, directory) => {
  const url = new URL(`${generateUniqueIdentifier()}.js`, directory);
  stdout.write(`RECORD >> ${url.href.substring(ROOT.href.length)}\n`);
  const content2 = `// ${path}\n${format(content1)}`;
  writeFileSync(url, content2, "utf-8");
  return {
    path: url.href,
    content: content2,
  };
};
