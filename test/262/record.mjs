import { writeFileSync } from "node:fs";
import { format } from "./format.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     original: string,
 *     instrumented: string,
 *     kind: "script" | "module",
 *     root: string,
 *   },
 * ) => string}
 */
export const recordInstrumentation = ({
  original,
  instrumented,
  kind,
  root,
}) => {
  const basename = /** @type {string} */ (root.split("/").pop()).split(".")[0];
  const extension = kind === "module" ? "mjs" : "js";
  writeFileSync(
    new URL(`codebase/${basename}.${extension}`, import.meta.url),
    ["// eslint-disable\n", "// @ts-nocheck\n", original].join("\n"),
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
