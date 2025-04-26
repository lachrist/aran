import { build, formatMessages } from "esbuild";
import { warn } from "node:console";

const { Error } = globalThis;

/**
 * @type {(
 *   base: import("./enum.d.ts").ModuleBase,
 * ) => Promise<string>}
 */
export const bundleModule = async (base) => {
  const result = await build({
    entryPoints: [`test/bench/base/${base}.mjs`],
    bundle: true,
    write: false,
    format: "esm",
    minify: false,
    sourcemap: false,
    platform: "node",
  });
  if (result.errors.length > 0) {
    const messages = await formatMessages(result.errors, {
      kind: "error",
      color: true,
    });
    throw new Error(messages.join("\n"));
  }
  if (result.warnings.length > 0) {
    const messages = await formatMessages(result.warnings, {
      kind: "warning",
      color: true,
    });
    warn(messages.join("\n"));
  }
  return [
    "// @ts-nocheck",
    "/* eslint-disable */",
    result.outputFiles[0].text,
  ].join("\n");
};
