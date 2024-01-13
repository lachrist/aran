import { writeFileSync } from "node:fs";
import { format } from "./format.mjs";
import { readdir, unlink } from "node:fs/promises";
import { AranTypeError } from "./error.mjs";

const { URL } = globalThis;

const directory = new URL("codebase/", import.meta.url);

/**
 * @type {(directory: URL) => Promise<void>}
 */
export const cleanup = async () => {
  for (const filename of await readdir(directory)) {
    if (filename !== ".gitignore") {
      await unlink(new URL(filename, directory));
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
      throw new AranTypeError("invalid kind", kind);
    }
  }
};

/**
 * @type {(
 *   character: string,
 * ) => string}
 */
const escapeCharacter = (character) =>
  `$${character.charCodeAt(0).toString(16).padStart(4, "0")}`;

/**
 * @type {(
 *   input: string,
 * ) => string}
 */
const escapeBasename = (input) =>
  input.replace(/[^_a-zA-Z0-9]/gu, escapeCharacter);

/** @type {test262.Instrument} */
export const record = ({ kind, url: url1, content: content1 }) => {
  const basename = escapeBasename(url1.href);
  const extension = getExtension(kind);
  const url2 = new URL(`${basename}.${extension}`, directory);
  const content2 = `// ${url1.href}\n${format(content1)}`;
  writeFileSync(url2, content2, "utf8");
  return { kind, url: url2, content: content2 };
};
