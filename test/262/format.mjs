import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const { Error, URL } = globalThis;

/** @type {(code: string) => string} */
export const format = (code) => {
  const { error, signal, status, stdout } = spawnSync(
    "node",
    [fileURLToPath(new URL("./prettier.mjs", import.meta.url))],
    {
      input: code,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "inherit"],
    },
  );
  if (error) {
    throw error;
  }
  if (signal !== null) {
    throw new Error(`format signal: ${signal}`);
  }
  if (status !== 0) {
    return code;
  }
  return stdout;
};
