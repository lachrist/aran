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

/** @type {test262.Instrument} */
export const record = ({ kind, url: url1, content: content1 }) => {
  const basename = /** @type {string} */ (url1.href.split("/").pop())
    .split(".")
    .slice(0, -1)
    .join(".");
  const extension = getExtension(kind);
  const url2 = new URL(`${basename}.${extension}`, directory);
  const content2 = `// ${url1.href}\n${format(content1)}`;
  writeFileSync(url2, content2, "utf8");
  return { kind, url: url2, content: content2 };
};
