import { writeFileSync } from "node:fs";
import { readdir, unlink } from "node:fs/promises";
import { format } from "./format.mjs";

const { URL } = globalThis;

for (const filename of await readdir(new URL("codebase/", import.meta.url))) {
  if (filename !== ".gitignore") {
    await unlink(new URL(`codebase/${filename}`, import.meta.url));
  }
}

/**
 * @type {(
 *   options: {
 *     original: string,
 *     instrumented: string,
 *     kind: "script" | "module",
 *     specifier: URL | number,
 *   },
 * ) => string}
 */
export const recordInstrumentation = ({
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
    new URL(`codebase/${basename}.${extension}`, import.meta.url),
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
    new URL(`codebase/${basename}*.${extension}`, import.meta.url),
    formatted,
    "utf8",
  );
  return formatted;
};
