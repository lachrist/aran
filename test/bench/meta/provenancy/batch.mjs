import { spawn } from "node:child_process";
import { compile } from "../../compile.mjs";
import { toMainPath } from "../../layout.mjs";
import { log } from "node:console";
import { parseBranch } from "./branch.mjs";
import { readFile, writeFile } from "node:fs/promises";

const { URL, Error, Promise, JSON } = globalThis;

/**
 * @type {[
 *   "stack",
 *   "intra",
 *   "inter",
 *   "store/internal",
 *   "store/external"
 * ]}
 */
const analyses = [
  "stack",
  "intra",
  "inter",
  "store/internal",
  "store/external",
];

/**
 * @type {(
 *   line: string,
 * ) => boolean}
 */
const isNotEmpty = (x) => x !== "";

/**
 * @type {(
 *   main: string,
 * ) => Promise<void>}
 */
const exec = (main) =>
  new Promise((resolve, reject) => {
    const child = spawn("node", [main], {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      if (status === 0 && signal === null) {
        resolve();
      } else {
        reject(
          new Error(
            `Process exited with status ${status} and signal ${signal}`,
          ),
        );
      }
    });
  });

/**
 * @type {(
 *   analysis: string,
 * ) => Promise<import("./branch.d.ts").Branch[]>}
 */
const loadTrace = async (analysis) =>
  (
    await readFile(
      new URL(`trace/${analysis.replace("/", "-")}.txt`, import.meta.url),
      "utf8",
    )
  )
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
      throw new Error("not same length");
    }
  }
  const length2 = traces.length;
  for (let index1 = 0; index1 < length1; index1 += 1) {
    const branch1 = traces[0][index1];
    let progress = branch1.prov;
    for (let index2 = 1; index2 < length2; index2 += 1) {
      const branch2 = traces[index2][index1];
      if (branch1.kind !== branch2.kind) {
        throw new Error("kind mismatch", {
          cause: {
            index1,
            index2,
            branch1,
            branch2,
          },
        });
      }
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
        throw new Error("provenancy mismatch", {
          cause: {
            index1,
            index2,
            branch1,
            branch2,
          },
        });
      }
      progress = branch2.prov;
    }
  }
};

/**
 * @type {(
 *   branch: import("./branch.d.ts").Branch,
 * ) => boolean}
 */
const selectBranch = ({ hash }) =>
  hash.startsWith("ConditionalStatement:") ||
  hash.startsWith("LogicalExpression:") ||
  hash.startsWith("IfStatement:") ||
  hash.startsWith("SwitchStatement:");
// hash.startsWith("WhileStatement:") ||
// hash.startsWith("DoWhileStatement:") ||
// hash.startsWith("ForStatement:") ||
// hash.startsWith("ForInStatement:") ||
// hash.startsWith("ForOfStatement:") ||

/**
 * @type {(
 *   branch: import("./branch.d.ts").Branch,
 * ) => number}
 */
const getBranchProvenancy = ({ prov }) => prov;

/**
 * @type {(
 *   trace: import("./branch.d.ts").Trace,
 * ) => number[]}
 */
const sieveTrace = (trace) =>
  trace.filter(selectBranch).map(getBranchProvenancy);

/**
 * @type {() => Promise<void>}
 */
const main = async () => {
  const base = "aran";
  for (const analysis of analyses) {
    log("compiling", analysis, "...");
    await compile(`provenancy/${analysis}`, base);
  }
  for (const analysis of analyses) {
    log("execution", analysis, "...");
    await exec(toMainPath(`provenancy/${analysis}`, base));
  }
  const traces = await Promise.all(analyses.map(loadTrace));
  check(traces);
  await writeFile(
    new URL("trace/dump.json", import.meta.url),
    JSON.stringify({
      labels: analyses,
      data: traces.map(sieveTrace),
    }),
    "utf8",
  );
};

await main();
