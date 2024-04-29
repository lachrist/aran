import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const {
  Math: { random },
  Date: { now },
} = globalThis;

const { Error, URL } = globalThis;

const TMP_DIR_URL = pathToFileURL(join(tmpdir(), "dummy"));

/** @type {(code: string) => string} */
export const format = (code) => {
  const url = new URL(
    `${now()}_${random().toString(36).substring(2)}`,
    TMP_DIR_URL,
  );
  writeFileSync(url, code, "utf8");
  const { error, signal, status } = spawnSync(
    "node",
    [fileURLToPath(new URL("./prettier.mjs", import.meta.url)), url.href],
    {
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
  try {
    return readFileSync(url, "utf8");
  } finally {
    unlinkSync(url);
  }
};
