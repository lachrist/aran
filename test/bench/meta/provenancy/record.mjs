import { closeSync, openSync, writeSync } from "node:fs";

const { process, Array } = globalThis;

/**
 * @type {(
 *   config: {
 *     output: URL,
 *     buffer_length: number,
 *   },
 * ) => (
 *   kind: import("aran").TestKind,
 *   prov: number,
 *   hash: import("./location.d.ts").NodeHash,
 * ) => void}
 */
export const compileRecordBranch = ({ output, buffer_length }) => {
  const handle = openSync(output, "w");
  const buffer = new Array(buffer_length);
  let index = 0;
  process.on("exit", () => {
    writeSync(handle, buffer.slice(0, index).join(""), null, "utf8");
    closeSync(handle);
    index = 0;
  });
  return (kind, prov, hash) => {
    if (index >= buffer_length) {
      writeSync(handle, buffer.join(""), null, "utf8");
      index = 0;
    }
    buffer[index++] = `${kind}|${prov}|${hash}\n`;
  };
};
