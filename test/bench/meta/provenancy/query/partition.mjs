import { argv } from "node:process";
import { isBase, isMeta } from "../../../enum.mjs";
import { loadTrace } from "../load.mjs";
import { writeFile } from "node:fs/promises";
import { spawn } from "../../../spawn.mjs";
import { fileURLToPath } from "node:url";
import { printExecName } from "../naming.mjs";
import { trace_home } from "../layout.mjs";
import { compileSelection } from "./select.mjs";

const { URL, JSON, Array, Map, Error, Math } = globalThis;

/**
 * @typedef {import("estree-sentry").Node<{}>["type"]} Type
 */

/**
 * @typedef {{
 *   type: Type,
 *   total: number,
 *   mean: number,
 *   percentiles: number[],
 * }} Summary
 */

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
 *   a: number,
 *   b: number,
 * ) => number}
 */
const add = (a, b) => a + b;

/**
 * @type {(
 *   entry1: [Type, number[]],
 *   entry2: [Type, number[]],
 * ) => number}
 */
const compareEntry = ([_type1, data1], [_type2, data2]) =>
  data2.length - data1.length;

/**
 * @type {(
 *   a: number,
 *   b: number,
 * ) => number}
 */
const substract = (a, b) => a - b;

/**
 * @type {(
 *   trace: import("../branch.js").Branch[],
 * ) => [Type, number[]][]}
 */
const partition = (trace) => {
  /**
   * @type {Map<import("estree-sentry").Node<{}>["type"], number[]>}
   */
  const map = new Map();
  for (const { type, prov } of trace) {
    if (map.has(type)) {
      /** @type {number[]} */ (map.get(type)).push(prov);
    } else {
      map.set(type, [prov]);
    }
  }
  return Array.from(map.entries());
};

/**
 * @type {(
 *   entry: [Type, number[]],
 * ) => string}
 */
const toTexRow = ([type, data]) => {
  const sort = data.toSorted(substract);
  const size = sort.length;
  return (
    [
      type,
      size,
      Math.round(sort.reduce(add, 0) / size),
      sort[Math.floor(size * 0.25)],
      sort[Math.floor(size * 0.5)],
      sort[Math.floor(size * 0.75)],
      sort[Math.floor(size * 0.95)],
      sort[Math.floor(size * 0.99)],
    ].join(" & ") + " \\\\"
  );
};

/**
 * @type {(
 *   entries: [Type, number[]][],
 * ) => string}
 */
const toTexTable = (entries) =>
  [
    "\\begin{tabular}{l|rrrrrrr}",
    "\\hline",
    [
      "\\textbf{Type}",
      "\\textbf{Size}",
      "\\textbf{Mean}",
      "\\textbf{p25\\%}",
      "\\textbf{p50\\%}",
      "\\textbf{p75\\%}",
      "\\textbf{p95\\%}",
      "\\textbf{p99\\%}",
    ].join(" & ") + " \\\\",
    ...entries.map(toTexRow),
    "\\end{tabular}",
  ].join("\n");

/**
 * @type {{[key in Type]: string}}
 */
const labelization = {
  Program: "Prog",
  FunctionDeclaration: "FctD",
  FunctionExpression: "FctE",
  ArrowFunctionExpression: "FctA",
  ThisExpression: "This",
  Identifier: "Id",
  Literal: "Lit",
  MemberExpression: "Mbr",
  CallExpression: "Call",
  NewExpression: "New",
  AssignmentExpression: "Assgn",
  BinaryExpression: "Bin",
  UnaryExpression: "Unr",
  UpdateExpression: "Upd",
  ConditionalExpression: "Cond",
  IfStatement: "If",
  SwitchStatement: "Swt",
  SwitchCase: "Case",
  WhileStatement: "While",
  DoWhileStatement: "DoWhile",
  ForStatement: "For",
  ForInStatement: "ForIn",
  ForOfStatement: "ForOf",
  BreakStatement: "Break",
  ContinueStatement: "Cont",
  ReturnStatement: "Ret",
  ThrowStatement: "Throw",
  TryStatement: "Try",
  CatchClause: "Catch",
  BlockStatement: "Naked",
  EmptyStatement: "Empty",
  ExpressionStatement: "Expr",
  DebuggerStatement: "Dbg",
  WithStatement: "With",
  LabeledStatement: "Label",
  VariableDeclaration: "VarD",
  VariableDeclarator: "VarE",
  ArrayExpression: "Arr",
  ObjectExpression: "Obj",
  Property: "Prop",
  SpreadElement: "Spread",
  RestElement: "Rest",
  SequenceExpression: "Seq",
  TemplateLiteral: "Tpl",
  TemplateElement: "TplE",
  TaggedTemplateExpression: "TagTpl",
  YieldExpression: "Yield",
  AwaitExpression: "Await",
  ImportExpression: "Imp",
  ImportDeclaration: "ImpD",
  ImportSpecifier: "ImpS",
  ImportDefaultSpecifier: "ImpDS",
  ImportNamespaceSpecifier: "ImpNS",
  ExportNamedDeclaration: "ExpND",
  ExportDefaultDeclaration: "ExpDD",
  ExportAllDeclaration: "ExpAD",
  ExportSpecifier: "ExpS",
  MetaProperty: "Meta",
  ClassDeclaration: "ClsD",
  ClassExpression: "ClsE",
  ClassBody: "ClsB",
  MethodDefinition: "MthD",
  Super: "Super",
  PrivateIdentifier: "PrivId",
  ChainExpression: "Chain",
  PropertyDefinition: "PropD",
  StaticBlock: "StatB",
  LogicalExpression: "Log",
  ObjectPattern: "ObjP",
  ArrayPattern: "ArrP",
  AssignmentPattern: "AsgP",
};

/**
 * @type {(
 *   type: Type,
 * ) => string}
 */
const toLabel = (name) => labelization[name];

/**
 * @type {(
 *   entries: [Type, number[]][],
 * ) => string}
 */
const toPlotData = (entries) =>
  JSON.stringify(
    entries.length === 1
      ? {
          type: "hist",
          data: entries[0][1],
          bins: 50,
          yscale: "log",
          // xscale: "log",
        }
      : {
          type: "box",
          labels: entries.map(get0).map(toLabel),
          data: entries.map(get1),
          // yscale: "log",
        },
  );

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async (argv) => {
  if (argv.length !== 3) {
    throw new Error("CLI Arg: selection meta base", { cause: argv });
  }
  const [pred, meta, base] = argv;
  const selectType = compileSelection(pred);
  if (!isMeta(meta)) {
    throw new Error("not a meta", { cause: { meta } });
  }
  if (!isBase(base)) {
    throw new Error("not a base", { cause: { base } });
  }
  const trace = await loadTrace({ base, meta });
  const entries = partition(trace).toSorted(compareEntry);
  await writeFile(
    new URL(`${printExecName({ base, meta })}.tex`, trace_home),
    toTexTable(entries),
    "utf8",
  );
  await writeFile(
    new URL(`${printExecName({ base, meta })}.json`, trace_home),
    toPlotData(entries.filter(([type]) => selectType(type))),
    "utf8",
  );
  const { status, signal } = await spawn("python3", [
    fileURLToPath(new URL("plot.py", import.meta.url)),
    printExecName({ base, meta }),
  ]);
  if (status !== 0 || signal !== null) {
    throw new Error("python3 plot failed", { cause: { status, signal } });
  }
};

await main(argv.slice(2));
