import { argv } from "node:process";
import { writeFile } from "node:fs/promises";
import { isBase, provenancy_meta_enum } from "../../../enum.mjs";
import { log } from "node:console";
import { loadTrace } from "../load.mjs";
import { trace_home } from "../layout.mjs";
import { fileURLToPath } from "node:url";
import { spawn } from "../../../spawn.mjs";

const { JSON, URL, Error, Promise } = globalThis;

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
 *   selection: string,
 * ) => (
 *   branch: import("../branch.d.ts").Branch,
 * ) => boolean}
 */
const compileSelection = (selection) => {
  switch (selection) {
    case "all": {
      return (_branch) => true;
    }
    case "switch": {
      return ({ type }) => type === "SwitchCase";
    }
    case "cond": {
      return ({ type }) =>
        type === "ConditionalExpression" || type === "IfStatement";
    }
    case "loop": {
      return ({ type }) =>
        type === "WhileStatement" ||
        type === "DoWhileStatement" ||
        type === "ForStatement" ||
        type === "ForInStatement" ||
        type === "ForOfStatement";
    }
    case "cond+loop": {
      return ({ type }) =>
        type === "ConditionalExpression" ||
        type === "IfStatement" ||
        type === "SwitchCase" ||
        type === "WhileStatement" ||
        type === "DoWhileStatement" ||
        type === "ForStatement" ||
        type === "ForInStatement" ||
        type === "ForOfStatement";
    }
    default: {
      throw new Error("Invalid selection", { cause: { selection } });
    }
  }
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
 *   entries: [
 *     import("../../../enum.d.ts").ProvenancyMeta,
 *     number[],
 *   ][],
 * ) => string}
 */
const toBoxPlot = (entries) =>
  JSON.stringify({
    labels: entries.map(get0).map(labelize),
    data: entries.map(get1),
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
  const selectBranch = compileSelection(selection);
  if (!base_enum.every(isBase)) {
    throw new Error("not all base", { cause: { argv } });
  }
  for (const base of base_enum) {
    await writeFile(
      new URL(`${base}.json`, trace_home),
      toBoxPlot(await crunch(base, { selectBranch })),
      "utf8",
    );
  }
  const { status, signal } = await spawn("python3", [
    fileURLToPath(new URL("boxplot.py", import.meta.url)),
    ...base_enum,
  ]);
  if (status !== 0 || signal !== null) {
    throw new Error("python3 failed", { cause: { status, signal } });
  }
};

await main(argv.slice(2));
