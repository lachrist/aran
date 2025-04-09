import { build, formatMessages } from "esbuild";
import { fileURLToPath } from "node:url";
import { warn } from "node:console";

const { Error } = globalThis;

/**
 * @type {(
 *   entry: URL,
 * ) => Promise<string>}
 */
export const bundleModule = async (entry) => {
  const result = await build({
    entryPoints: [fileURLToPath(entry)],
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
  return result.outputFiles[0].text;
};
