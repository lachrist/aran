import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const {
  Error,
  JSON,
  URL,
  Promise,
  undefined,
  Object: { keys: listKey, values: listValue },
} = globalThis;

/**
 * @type {(
 *   plot: import("./plot").BoxPlot,
 * ) => Promise<void>}
 */
export const plotBox = ({ output, title, content, show_flier }) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "python3",
      [fileURLToPath(new URL("plot-box.py", import.meta.url))],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      if (signal !== null) {
        return reject(new Error(`plot.py failed with signal ${signal}`));
      }
      if (status !== 0) {
        return reject(new Error(`plot.py failed with status ${status}`));
      }
      resolve(undefined);
    });
    child.stdin.write(
      JSON.stringify({
        output,
        title,
        labels: listKey(content),
        payload: listValue(content),
        show_flier,
      }),
      "utf-8",
    );
    child.stdin.end();
  });
