import { writeFileSync } from "node:fs";
import { format } from "./format.mjs";
import { readdir, unlink } from "node:fs/promises";
import { stdout } from "node:process";
import { AranTypeError } from "./error.mjs";

const { URL, performance, Math } = globalThis;

const root = new URL("../../", import.meta.url);

const base = new URL("test/262/codebase/", root);

/**
 * @type {(directory: URL) => Promise<void>}
 */
export const cleanup = async () => {
  for (const filename of await readdir(base)) {
    if (filename !== ".gitignore") {
      await unlink(new URL(filename, base));
    }
  }
};

/**
 * @type {(
 *   kind: "script" | "module" | "eval" | "harness",
 * ) => string}
 */
const getExtension = (kind) => {
  switch (kind) {
    case "module": {
      return "mjs";
    }
    case "script": {
      return "js";
    }
    case "eval": {
      return "js";
    }
    case "harness": {
      return "js";
    }
    default: {
      throw new AranTypeError(kind);
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
 *   kind: "script" | "module" | "eval" | "harness",
 *   path: string | null,
 *   content: string,
 * ) => {
 *   location: string,
 *   content: string,
 * }}
 */
export const record = (kind, path, content1) => {
  const url = new URL(
    `${generateUniqueIdentifier()}.${getExtension(kind)}`,
    base,
  );
  stdout.write(`RECORD >> ${url.href.substring(root.href.length)}\n`);
  const content2 = `// ${kind} >> ${path ?? "???"}\n${format(content1)}`;
  writeFileSync(url, content2, "utf8");
  return {
    location: url.href,
    content: content2,
  };
};
