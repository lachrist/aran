import { spawn } from "node:child_process";
import { stdin } from "node:process";
import { fileURLToPath } from "node:url";

const { process, URL, Promise, Error, undefined } = globalThis;

for (const stage of process.argv.slice(2)) {
  stdin.write(`\n\n\n====== ${stage} ======\n\n\n\n`, "utf8");
  await new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      [
        "--experimental-vm-modules",
        "--expose-gc",
        fileURLToPath(new URL("./main.mjs", import.meta.url)),
        stage,
      ],
      {
        stdio: "inherit",
      },
    );
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal !== null) {
        reject(new Error(`Signal ${signal}`));
      } else {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`Exit code: ${code}`));
        }
      }
    });
  });
}
