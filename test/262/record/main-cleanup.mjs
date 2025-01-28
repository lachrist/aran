import { stat } from "node:fs/promises";
import { ROOT } from "../layout.mjs";
import { cleanup } from "./record.mjs";
import { env, stderr } from "node:process";

const { process, URL, Object } = globalThis;

/**
 * @type {(
 *   env: { [key in string] ?: string }
 * ) => Promise<null | string>}
 */
const main = async (env) => {
  if (!Object.hasOwn(env, "ARAN_RECORD")) {
    return "Missing ARAN_RECORD environment variable";
  }
  const directory = new URL(/** @type {string} */ (env.ARAN_RECORD), ROOT);
  try {
    if (!(await stat(directory)).isDirectory()) {
      return "Error: record-directory is not a directory";
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return "Error: record-directory does not exist";
    } else {
      throw error;
    }
  }
  await cleanup(directory);
  return null;
};

const status = await main(env);
if (status !== null) {
  stderr.write(status);
  process.exitCode ||= 1;
}
