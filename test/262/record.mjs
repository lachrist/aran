import { writeFileSync } from "node:fs";
import { format } from "./format.mjs";
import { readdir, unlink } from "node:fs/promises";

const { URL } = globalThis;

/**
 * @type {(directory: URL) => Promise<void>}
 */
export const cleanup = async (directory) => {
  for (const filename of await readdir(directory)) {
    if (filename !== ".gitignore") {
      await unlink(new URL(filename, directory));
    }
  }
};

/**
 * @type {(
 *   options: {
 *     directory: URL,
 *     original: string,
 *     instrumented: string,
 *     kind: "script" | "module",
 *     specifier: URL | number,
 *   },
 * ) => string}
 */
export const recordInstrumentation = ({
  directory,
  original,
  instrumented,
  kind,
  specifier,
}) => {
  const basename =
    typeof specifier === "number"
      ? `dynamic#${specifier}`
      : /** @type {string} */ (specifier.href.split("/").pop())
          .split(".")
          .slice(0, -1)
          .join(".");
  const extension = kind === "module" ? "mjs" : "js";
  writeFileSync(
    new URL(`${basename}.${extension}`, directory),
    [
      "// eslint-disable\n",
      "// @ts-nocheck\n",
      original.replace(/\/\/ @ts-check/gu, "// @TS_CHECK"),
    ].join("\n"),
    "utf8",
  );
  const formatted = [
    "// eslint-disable\n",
    "// @ts-nocheck\n",
    format(instrumented),
  ].join("\n");
  writeFileSync(
    new URL(`${basename}*.${extension}`, directory),
    formatted,
    "utf8",
  );
  return formatted;
};
