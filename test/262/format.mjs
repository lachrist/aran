import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const { Error, URL } = globalThis;

/** @type {(code: string) => string} */
export const format = (code) => {
  const { signal, stdout, stderr, error, status } = spawnSync(
    "node",
    [fileURLToPath(new URL("./prettier.mjs", import.meta.url))],
    {
      input: code,
      encoding: "utf8",
    },
  );
  if (error) {
    throw error;
  }
  if (signal !== null) {
    throw new Error(`format signal: ${signal} >> ${stderr}`);
  }
  if (status !== 0) {
    throw new Error(`format exit code: ${status} >> ${stderr}`);
  }
  return stdout;
};
