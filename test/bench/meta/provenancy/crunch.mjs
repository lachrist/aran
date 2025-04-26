import { argv } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { parseBranch } from "./branch.mjs";
import { printTraceName, trace_home } from "./naming.mjs";
import { isBase } from "../../enum.mjs";

const { JSON, URL, Error, Promise } = globalThis;

/**
 * @type {import("../../enum.d.ts").Meta[]}
 */
const meta_enum = JSON.parse(
  await readFile(new URL("meta.json", import.meta.url), "utf8"),
);

/**
 * @type {(
 *   line: string,
 * ) => boolean}
 */
const isNotEmpty = (x) => x !== "";

/**
 * @type {(
 *   test: {
 *     meta: import("../../enum.d.ts").Meta,
 *     base: import("../../enum.d.ts").Base,
 *   },
 * ) => Promise<import("./branch.d.ts").Branch[]>}
 */
const loadTrace = async (test) =>
  (await readFile(new URL(printTraceName(test), trace_home), "utf8"))
    .split("\n")
    .filter(isNotEmpty)
    .map(parseBranch);

/**
 * @type {(
 *   traces: import("./branch.d.ts").Trace[]
 * ) => void}
 */
const check = (traces) => {
  const length1 = traces[0].length;
  for (const trace of traces) {
    if (trace.length !== length1) {
      throw new Error("not same length", { cause: {} });
    }
  }
  const length2 = traces.length;
  for (let index1 = 0; index1 < length1; index1 += 1) {
    const branch1 = traces[0][index1];
    let progress = branch1.prov;
    for (let index2 = 1; index2 < length2; index2 += 1) {
      const branch2 = traces[index2][index1];
      if (branch1.hash !== branch2.hash) {
        throw new Error("hash mismatch", {
          cause: {
            index1,
            index2,
            branch1,
            branch2,
          },
        });
      }
      if (progress > branch2.prov) {
        throw new Error("Non monotonic provenancy", {
          cause: { index1, index2, branch1, branch2 },
        });
      }
      progress = branch2.prov;
    }
  }
};

/**
 * @type {(
 *   branch: import("./branch.d.ts").Branch,
 * ) => number}
 */
const getBranchProvenancy = ({ prov }) => prov;

/**
 * @type {(
 *   base: import("../../enum.d.ts").Base,
 *   config: {
 *     selectBranch: (
 *       branch: import("./branch.d.ts").Branch,
 *     ) => boolean,
 *   },
 * ) => Promise<number[][]>}
 */
export const crunch = async (base, { selectBranch }) => {
  const traces = await Promise.all(
    meta_enum.map((meta) => loadTrace({ base, meta })),
  );
  check(traces);
  return traces.map((trace) =>
    trace.filter(selectBranch).map(getBranchProvenancy),
  );
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (!argv.every(isBase)) {
    throw new Error("not all base", { cause: { argv } });
  }
  for (const base of argv) {
    await writeFile(
      new URL(`trace/${base}.json`, import.meta.url),
      JSON.stringify(await crunch(base, { selectBranch: (_branch) => true })),
      "utf8",
    );
  }
};

await main(argv.slice(2));
