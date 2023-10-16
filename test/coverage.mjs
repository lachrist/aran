import { spawn } from "node:child_process";
import { stdout } from "node:process";
import { ordering } from "./ordering.mjs";

const { Error, Promise } = globalThis;

/** @type {(path: string) => Promise<{signal: string | null, status: number | null}>} */
const testAsync = (path) => {
  const child = spawn(
    "npx",
    [
      "c8",
      "--100",
      "--include",
      `lib/${path}.mjs`,
      "--",
      "node",
      `lib/${path}.test.mjs`,
    ],
    { stdio: "inherit" },
  );
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      resolve({ signal, status });
    });
  });
};

for (const path of ordering) {
  stdout.write(`${path}...\n`, "utf8");
  const { signal, status } = await testAsync(path);
  if (signal !== null) {
    throw new Error(`Signal ${signal}`);
  }
  if (status !== 0) {
    throw new Error(`Status ${status}`);
  }
}
