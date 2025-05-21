import { argv } from "node:process";
import { writeFile } from "node:fs/promises";
import { isBase, provenancy_meta_enum } from "../../../enum.mjs";
import { log } from "node:console";
import { loadTrace } from "../load.mjs";
import { trace_home } from "../layout.mjs";
import { fileURLToPath } from "node:url";
import { spawn } from "../../../spawn.mjs";
import { compileSelection } from "./select.mjs";

const { Math, JSON, URL, Error, Promise } = globalThis;

/**
 * @type {<X>(
 *   xs: [X, ...unknown[]]
 * ) => X}
 */
const get0 = (x) => x[0];

/**
 * @type {<X>(
 *   xs: [unknown, X, ...unknown[]]
 * ) => X}
 */
const get1 = (x) => x[1];

/**
 * @type {(
 *   branch: import("../branch.d.ts").Branch,
 * ) => number}
 */
const getBranchProvenancy = ({ prov }) => prov;

/**
 * @type {(
 *   traces: import("../branch.d.ts").Trace[]
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
 *   base: import("../../../enum.d.ts").Base,
 *   config: {
 *     selectBranch: (
 *       branch: import("../branch.d.ts").Branch,
 *     ) => boolean,
 *   },
 * ) => Promise<[
 *   import("../../../enum.d.ts").ProvenancyMeta,
 *   number[],
 * ][]>}
 */
export const crunch = async (base, { selectBranch }) => {
  const traces = await Promise.all(
    provenancy_meta_enum.map((meta) => loadTrace({ base, meta })),
  );
  check(traces);
  return traces.map((trace, index) => [
    provenancy_meta_enum[index],
    trace.filter(selectBranch).map(getBranchProvenancy),
  ]);
};

/**
 * @type {(
 *   meta: import("../../../enum.d.ts").ProvenancyMeta,
 * ) => string}
 */
const labelize = (meta) => {
  switch (meta) {
    case "provenancy/stack": {
      return "stack";
    }
    case "provenancy/intra": {
      return "intra";
    }
    case "provenancy/inter": {
      return "inter";
    }
    case "provenancy/store/external": {
      return "store";
    }
    case "provenancy/store/internal": {
      return "store*";
    }
    default: {
      throw new Error("Invalid meta", { cause: { meta } });
    }
  }
};

/**
 * @type {(
 *   a: number,
 *   b: number,
 * ) => number}
 */
const substract = (a, b) => a - b;

/**
 * @type {(
 *   entries: [
 *     import("../../../enum.d.ts").ProvenancyMeta,
 *     number[],
 *   ][],
 * ) => string}
 */
const toTexTable = (entries) => {
  const lines = [];
  lines.push("\\begin{tabular}{l|rrrrrr}");
  lines.push(
    [
      "\\textbf{Analysis}",
      "\\textbf{Mean}",
      "\\textbf{P25}",
      "\\textbf{P50}",
      "\\textbf{P75}",
      "\\textbf{P95}",
      "\\textbf{P99}",
    ].join(" & ") + " \\\\",
  );
  lines.push("\\hline");
  for (const [meta, data] of entries) {
    const label = labelize(meta);
    const sort = data.toSorted(substract);
    const size = sort.length;
    lines.push(
      [
        label,
        Math.round(sort.reduce((a, b) => a + b, 0) / size),
        sort[Math.floor(size * 0.25)],
        sort[Math.floor(size * 0.5)],
        sort[Math.floor(size * 0.75)],
        sort[Math.floor(size * 0.95)],
        sort[Math.floor(size * 0.99)],
      ].join(" & ") + " \\\\",
    );
  }
  lines.push("\\end{tabular}");
  return lines.join("\n");
};

/**
 * @type {(
 *   entries: [
 *     import("../../../enum.d.ts").ProvenancyMeta,
 *     number[],
 *   ][],
 * ) => string}
 */
const toPlotData = (entries) =>
  JSON.stringify({
    type: "box",
    labels: entries.map(get0).map(labelize),
    data: entries.map(get1),
    yscale: "linear",
    ylabel: "Provenancy",
  });

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.includes("--help")) {
    return log("usage: node <selection> [...base]");
  }
  if (argv.length === 0) {
    throw new Error("no selection", { cause: { argv } });
  }
  const [selection, ...base_enum] = argv;
  const selectType = compileSelection(selection);
  if (!base_enum.every(isBase)) {
    throw new Error("not all base", { cause: { argv } });
  }
  for (const base of base_enum) {
    const entries = await crunch(base, {
      selectBranch: ({ type }) => selectType(type),
    });
    await writeFile(
      new URL(`${base}-${selection}.json`, trace_home),
      toPlotData(entries),
      "utf8",
    );
    await writeFile(
      new URL(`${base}-${selection}.tex`, trace_home),
      toTexTable(entries),
      "utf8",
    );
  }
  const { status, signal } = await spawn("python3", [
    fileURLToPath(new URL("plot.py", import.meta.url)),
    ...base_enum.map((base) => `${base}-${selection}`),
  ]);
  if (status !== 0 || signal !== null) {
    throw new Error("python3 failed", { cause: { status, signal } });
  }
};

await main(argv.slice(2));
