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

/** @type {(kind: "script" | "module") => string} */
const getExtension = (kind) => {
  switch (kind) {
    case "module": {
      return "mjs";
    }
    case "script": {
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

/** @type {import("./types").Instrument} */
export const record = ({ kind, url: url1, content: content1 }) => {
  const basename = generateUniqueIdentifier();
  const extension = getExtension(kind);
  const url2 = new URL(`${basename}.${extension}`, base);
  stdout.write(`RECORD >> ${url2.href.substring(root.href.length)}\n`);
  const content2 = `// ${url1.href}\n${format(content1)}`;
  writeFileSync(url2, content2, "utf8");
  return { kind, url: url2, content: content2 };
};
