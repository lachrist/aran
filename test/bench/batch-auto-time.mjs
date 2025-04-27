import { writeFile, readFile } from "node:fs/promises";
import { argv } from "node:process";
import { spawn } from "./spawn.mjs";
import { fileURLToPath } from "node:url";

const { Reflect, Error, URL, JSON, Array } = globalThis;

/**
 * @type {(
 *   a: number,
 *   b: number,
 * ) => number}
 */
const add = (a, b) => a + b;

/**
 * @type {(
 *   a: number,
 *   b: number,
 * ) => number}
 */
const substract = (a, b) => a - b;

/**
 * @typedef {{
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").AutoBase,
 *   time: number[],
 * }} Result
 */

/**
 * @type {{
 *   [key in import("./enum.d.ts").Meta]: string
 * }}
 */
const meta_record = {
  "none": "none",
  "bare": "bare",
  "full": "full",
  "track": "track",
  "linvail/custom/external": "cust",
  "linvail/custom/internal": "cust*",
  "linvail/standard/external": "stnd",
  "linvail/standard/internal": "stnd*",
  "provenancy/stack": "stack",
  "provenancy/intra": "intra",
  "provenancy/inter": "inter",
  "provenancy/store/external": "store",
  "provenancy/store/internal": "store*",
  "symbolic/intensional/void": "sym",
  "symbolic/intensional/file": "sym!",
  "symbolic/extensional/void": "sym+",
  "symbolic/extensional/file": "sym+!",
};

const meta_enum = /** @type {import("./enum.d.ts").Meta[]} */ (
  Reflect.ownKeys(meta_record)
);

/**
 * @type {{
 *   [key in import("./enum.d.ts").AutoBase]?: string
 * }}
 */
const base_record = {
  "auto-123-5": "123",
  "auto-person-5": "person",
  // "auto-deltablue-5": "deltablue",
};

const base_enum = /** @type {import("./enum.d.ts").AutoBase[]} */ (
  Reflect.ownKeys(base_record)
);

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 * ) => string}
 */
export const labelizeMeta = (meta) => meta_record[meta];

/**
 * @type {(
 *   meta: import("./enum.d.ts").AutoBase,
 * ) => string}
 */
// eslint-disable-next-line local/no-optional-chaining
export const labelizeBase = (base) => base_record?.[base] ?? base;

/**
 * @type {<X>(
 *   input: { time: X },
 * ) => X}
 */
const getTime = ({ time }) => time;

/**
 * @type {(
 *   data: number[],
 * ) => number}
 */
const collapse = (data) => {
  if (data.length === 0) {
    throw new Error("no time");
  } else if (data.length < 5) {
    return data.reduce(add, 0) / data.length;
  } else {
    const sort = data.sort(substract);
    return sort.slice(1, -1).reduce(add, 0) / (data.length - 2);
  }
};

/**
 * @type {(
 *   base_enum: import("./enum.d.ts").AutoBase[],
 *   meta_enum: import("./enum.d.ts").Meta[],
 *   results: Result[],
 * ) => string}
 */
const toLinePlot = (base_enum, meta_enum, results) =>
  JSON.stringify({
    labels: meta_enum.map(labelizeMeta),
    lines: base_enum.map((base) => ({
      label: labelizeBase(base),
      xs: Array.from({ length: meta_enum.length }, (_, i) => i + 1),
      ys: results
        .filter(({ base: current_base }) => base === current_base)
        .sort(
          ({ meta: meta1 }, { meta: meta2 }) =>
            meta_enum.indexOf(meta1) - meta_enum.indexOf(meta2),
        )
        .map(getTime)
        .map(collapse),
    })),
  });

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (_argv) => {
  await writeFile(
    new URL("batch-auto-time.json", import.meta.url),
    toLinePlot(
      base_enum,
      meta_enum,
      JSON.parse(
        await readFile(new URL("batch-auto.json", import.meta.url), "utf8"),
      ),
    ),
    "utf8",
  );
  await spawn("python3", [
    fileURLToPath(new URL("batch-auto-time.py", import.meta.url)),
  ]);
};

await main(argv.slice(2));
