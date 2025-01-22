/* eslint-disable local/no-jsdoc-typedef */

import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { AranTestError } from "../../error.mjs";

const {
  Reflect: { apply, getPrototypeOf },
  String: {
    prototype: { startsWith },
  },
  Object: { hasOwn },
} = globalThis;

/**
 * @typedef {`hash:${string}`} Hash
 * @typedef {[
 *   import("aran").FlexibleAspectKind,
 *   import("aran").Node["type"],
 *   Hash,
 * ]} Point
 * @typedef {`dynamic://eval/local/${Hash}`} LocalEvalPath
 * @typedef {(
 *   | import("../../fetch").HarnessName
 *   | import("../../fetch").DependencyPath
 *   | import("../../fetch").TestPath
 *   | LocalEvalPath
 * )} FilePath
 * @typedef {string & {__brand: "JavaScriptIdentifier"}} JavaScriptIdentifier
 * @typedef {string & {__brand: "Variable"}} Variable
 * @typedef {string & {__brand: "Label"}} Label
 * @typedef {string & {__brand: "Specifier"}} Specifier
 * @typedef {string & {__brand: "Source"}} Source
 * @typedef {{
 *   Variable: Variable,
 *   Label: Label,
 *   Specifier: Specifier,
 *   Source: Source,
 *   Tag: Hash,
 * }} Atom
 * @typedef {unknown & {__brand: "Value"}} Value
 * @typedef {"@state"} State
 */

const STATE = "@state";

const HASH_PREFIX = ["hash:"];

/**
 * @type {{
 *   [key in import("aran").FlexibleAspectKind]: null,
 * }}
 */
const ASPECT_KIND_ENUM = {
  "apply@around": null,
  "construct@around": null,
  "eval@before": null,
  "block@setup": null,
  "block@before": null,
  "block@declaration": null,
  "block@declaration-overwrite": null,
  "block@teardown": null,
  "block@throwing": null,
  "program-block@after": null,
  "closure-block@after": null,
  "segment-block@after": null,
  "statement@before": null,
  "statement@after": null,
  "effect@before": null,
  "effect@after": null,
  "expression@before": null,
  "expression@after": null,
};

/**
 * @type {{
 *   [key in import("aran").Statement["type"]]: null
 * }}
 */
const STATEMENT_NODE_TYPE_ENUM = {
  BlockStatement: null,
  BreakStatement: null,
  DebuggerStatement: null,
  EffectStatement: null,
  IfStatement: null,
  TryStatement: null,
  WhileStatement: null,
};

/**
 * @type {{
 *   [key in import("aran").Effect["type"]]: null
 * }}
 */
const EFFECT_NODE_TYPE_ENUM = {
  ConditionalEffect: null,
  ExportEffect: null,
  ExpressionEffect: null,
  WriteEffect: null,
};

/**
 * @type {{
 *   [key in import("aran").Expression["type"]]: null
 * }}
 */
const EXPRESSION_NODE_TYPE_ENUM = {
  ApplyExpression: null,
  AwaitExpression: null,
  ClosureExpression: null,
  ConditionalExpression: null,
  ConstructExpression: null,
  EvalExpression: null,
  ImportExpression: null,
  IntrinsicExpression: null,
  PrimitiveExpression: null,
  ReadExpression: null,
  SequenceExpression: null,
  YieldExpression: null,
};

///////////////
// Predicate //
///////////////

/**
 * @type {(
 *   node: import("aran").Node,
 * ) => boolean}
 */
const isNode = (node) =>
  typeof node === "object" &&
  node !== null &&
  hasOwn(node, "type") &&
  typeof node.type === "string";

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isProgramNodeType = (type) => type === "Program";

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isBlockType = (type) =>
  type === "RoutineBlock" || type === "SegmentBlock";

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isRoutineBlockType = (type) => type === "RoutineBlock";

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isSegmentBlockType = (type) => type === "SegmentBlock";

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isStatementType = (type) =>
  typeof type === "string" && hasOwn(STATEMENT_NODE_TYPE_ENUM, type);

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isEffectType = (type) =>
  typeof type === "string" && hasOwn(EFFECT_NODE_TYPE_ENUM, type);

/**
 * @type {(
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isExpressionType = (type) =>
  typeof type === "string" && hasOwn(EXPRESSION_NODE_TYPE_ENUM, type);

/**
 * @type {(
 *   hash: Hash,
 * ) => boolean}
 */
const isHash = (hash) =>
  typeof hash === "string" && apply(startsWith, hash, HASH_PREFIX);

/**
 * @type {(
 *   state: State,
 * ) => boolean}
 */
const isState = (state) => state === STATE;

/**
 * @type {(
 *   kind: import("aran").FlexibleAspectKind,
 * ) => boolean}
 */
const isAspectKind = (kind) =>
  typeof kind === "string" && hasOwn(ASPECT_KIND_ENUM, kind);

/**
 * @type {(
 *   frame: {[key in Variable]: Value}
 * ) => boolean}
 */
const isFrame = (frame) =>
  typeof frame === "object" && frame !== null && getPrototypeOf(frame, null);

/**
 * @type {(
 *   value: Value,
 * ) => boolean}
 */
const isValue = (_value) => true;

////////////
// Assert //
////////////

/**
 * @type {(
 *   actual: unknown,
 *   expect: unknown
 * ) => void}
 */
const assertEqual = (actual, expect) => {
  if (actual !== expect) {
    throw new AranTestError({ message: "assertion failure", actual, expect });
  }
};

/**
 * @type {<X>(
 *   predicate: (value: X) => boolean,
 *   value: X,
 * ) => void}
 */
const assertPredicate = (predicate, value) => {
  if (!predicate(value)) {
    throw new AranTestError({
      message: "assertion failure",
      predicate: predicate.name,
      value,
    });
  }
};

/**
 * @type {(
 *   input: any[],
 *   predicates: ((arg: any) => boolean)[],
 * ) => void}
 */
const assertInput = (input, predicates) => {
  assertEqual(input.length, predicates.length);
  const { length } = input;
  for (let index = 0; index < length; index++) {
    assertPredicate(predicates[index], input[index]);
  }
};

/**
 * @type {<X1, X2, X3>(
 *   input: [X1, X2, X3],
 *   predicates: [
 *     (arg: X1) => boolean,
 *     (arg: X2) => boolean,
 *     (arg: X3) => boolean,
 *   ],
 * ) => void}
 */
const assertInput3 = assertInput;

/**
 * @type {<X1, X2, X3, X4>(
 *   input: [X1, X2, X3, X4],
 *   predicates: [
 *     (arg: X1) => boolean,
 *     (arg: X2) => boolean,
 *     (arg: X3) => boolean,
 *     (arg: X4) => boolean,
 *   ],
 * ) => void}
 */
const assertInput4 = assertInput;

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   input: [X1, X2, X3, X4, X5],
 *   predicates: [
 *     (arg: X1) => boolean,
 *     (arg: X2) => boolean,
 *     (arg: X3) => boolean,
 *     (arg: X4) => boolean,
 *     (arg: X5) => boolean
 *   ],
 * ) => void}
 */
const assertInput5 = assertInput;

////////////
// Advice //
////////////

/**
 * @type {import("aran").Digest<Hash>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  `hash:${file_path}:${node_path}`;

/**
 * @type {(hash: Hash) => FilePath}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

const { setup, trans, retro } = compileAran(
  {
    mode: "normal",
    escape_prefix: "__aran__",
    global_object_variable: "globalThis",
    intrinsic_global_variable: "__intrinsic__",
    global_declarative_record: "builtin",
    digest,
  },
  toEvalPath,
);

/**
 * @type {(
 *   kind: import("aran").FlexibleAspectKind,
 * ) => JavaScriptIdentifier}
 */
const toGlobalVariable = (kind) =>
  /** @type {JavaScriptIdentifier} */ (
    `aran_${kind.replaceAll("@", "_").replaceAll("-", "_")}`
  );

/**
 * @type {(
 *   kind: import("aran").FlexibleAspectKind,
 * ) => (
 *   node: import("aran").Node<Atom>,
 *   parent: import("aran").Node<Atom>,
 *   root: import("aran").Node<Atom>,
 * ) => Point}
 */
const compilePointcut = (kind) => (node, parent, root) => {
  assertPredicate(isNode, node);
  assertPredicate(isNode, parent);
  assertPredicate(isNode, root);
  assertEqual(root.type, "Program");
  return [kind, node.type, node.tag];
};

/**
 * @type {() => import("aran").FlexibleAspect<
 *   Point,
 *   State,
 *   Value,
 *   Atom,
 *   JavaScriptIdentifier,
 * >}
 */
const compileAspect = ({}) => ({
  [toGlobalVariable("block@setup")]: {
    kind: "block@setup",
    pointcut: compilePointcut("block@setup"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isBlockType, isHash]);
      return STATE;
    },
  },
  [toGlobalVariable("block@before")]: {
    kind: "block@before",
    pointcut: compilePointcut("block@before"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isBlockType, isHash]);
      return STATE;
    },
  },
  [toGlobalVariable("block@declaration")]: {
    kind: "block@declaration",
    pointcut: compilePointcut("block@declaration"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isFrame,
        isAspectKind,
        isBlockType,
        isHash,
      ]);
    },
  },
  [toGlobalVariable("block@declaration-overwrite")]: {
    kind: "block@declaration-overwrite",
    pointcut: compilePointcut("block@declaration-overwrite"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isFrame,
        isAspectKind,
        isBlockType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toGlobalVariable("program-block@after")]: {
    kind: "program-block@after",
    pointcut: compilePointcut("program-block@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isValue,
        isAspectKind,
        isProgramNodeType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toGlobalVariable("closure-block@after")]: {
    kind: "closure-block@after",
    pointcut: compilePointcut("closure-block@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isValue,
        isAspectKind,
        isRoutineBlockType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toGlobalVariable("segment-block@after")]: {
    kind: "segment-block@after",
    pointcut: compilePointcut("segment-block@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isValue,
        isAspectKind,
        isSegmentBlockType,
        isHash,
      ]);
      return input[1];
    },
  },
});

// /**
//  * @type {import("aran").FlexibleWeaveConfig}
//  */
// const conf = {
//   initial_state: null,
//   pointcut: {
//     "block@setup": () => {},
//     "block@before": () => {},
//     "block@declaration": () => {},
//     "block@declaration-overwrite": () => {},
//     "program-block@after": () => {},
//     "closure-block@after": () => {},
//     "segment-block@after": () => {},
//     "block@throwing": () => {},
//     "block@teardown": () => {},
//     "statement@before": () => {},
//     "statement@after": () => {},
//     "effect@before": () => {},
//     "effect@after": () => {},
//     "expression@before": () => {},
//     "expression@after": () => {},
//     "eval@before": () => {},
//     "apply@around": () => {},
//     "construct@around": () => {},
//   },
// };

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["flex-void"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup,
  instrument: ({ type, kind, path, content }) => ({
    path,
    content:
      type === "main"
        ? retro(weaveFlexible(trans(path, kind, content), conf))
        : content,
  }),
};
