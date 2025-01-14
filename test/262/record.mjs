import { writeFileSync } from "node:fs";
import { format } from "./format.mjs";
import { readdir, unlink } from "node:fs/promises";
import { stdout } from "node:process";

const { URL, performance, Math } = globalThis;

const root = new URL("../../", import.meta.url);

const base = new URL("test/262/codebase/", root);

/**
 * @type {() => Promise<void>}
 */
export const cleanup = async () => {
  for (const filename of await readdir(base)) {
    if (filename !== ".gitignore") {
      await unlink(new URL(filename, base));
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
 *   file: import("./stage").File,
 * ) => import("./stage").File}
 */
export const record = ({ path, content: content1 }) => {
  const url = new URL(`${generateUniqueIdentifier()}.js`, base);
  stdout.write(`RECORD >> ${url.href.substring(root.href.length)}\n`);
  const content2 = `// ${path}\n${format(content1)}`;
  writeFileSync(url, content2, "utf8");
  return {
    path: url.href,
    content: content2,
  };
};
