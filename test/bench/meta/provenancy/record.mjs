import { closeSync, openSync, writeSync } from "node:fs";
import { printTraceName, trace_home } from "./naming.mjs";
import { digestBranch } from "./branch.mjs";

const { URL, process, Array } = globalThis;

/**
 * @type {(
 *   config: {
 *     meta: import("../../enum.d.ts").Meta,
 *     base: import("../../enum.d.ts").Base,
 *     buffer_length: number,
 *   },
 * ) => (
 *   type: import("aran").TestKind,
 *   prov: number,
 *   hash: import("./location.d.ts").NodeHash,
 * ) => void}
 */
export const compileRecordBranch = ({ buffer_length, meta, base }) => {
  const handle = openSync(
    new URL(printTraceName({ base, meta }), trace_home),
    "w",
  );
  const buffer = new Array(buffer_length);
  let index = 0;
  process.on("exit", () => {
    writeSync(handle, buffer.slice(0, index).join(""), null, "utf8");
    closeSync(handle);
    index = 0;
  });
  return (_kind, prov, hash) => {
    if (index >= buffer_length) {
      writeSync(handle, buffer.join(""), null, "utf8");
      index = 0;
    }
    buffer[index++] = digestBranch(prov, hash);
  };
};
