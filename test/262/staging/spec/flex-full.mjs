/* eslint-disable local/no-jsdoc-typedef */

import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { AranTestError } from "../../error.mjs";
import { record } from "../../record/index.mjs";

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

const {
  Array: { isArray },
  Reflect: { apply, getPrototypeOf, defineProperty },
  String: {
    prototype: { startsWith },
  },
  Object: { hasOwn, keys },
} = globalThis;

/**
 * @type {<K extends PropertyKey>(
 *   record: { [key in K]: unknown },
 * ) => K[]}
 */
const listKey = keys;

const STATE = "@state";

const HASH_PREFIX = ["hash:"];

/**
 * @type {{
 *   [key in import("aran").FlexibleAspectKind]: null
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
 *   node: import("aran").Node["type"],
 * ) => boolean}
 */
const isEvalExpressionType = (type) => type === "EvalExpression";

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
  typeof frame === "object" && frame !== null && getPrototypeOf(frame) === null;

/**
 * @type {(
 *   value: Value,
 * ) => boolean}
 */
const isValue = (_value) => true;

/**
 * @type {(
 *   value: Value[],
 * ) => boolean}
 */
const isValueArray = isArray;

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

/**
 * @type {<X1, X2, X3, X4, X5, X6>(
 *   input: [X1, X2, X3, X4, X5, X6],
 *   predicates: [
 *     (arg: X1) => boolean,
 *     (arg: X2) => boolean,
 *     (arg: X3) => boolean,
 *     (arg: X4) => boolean,
 *     (arg: X5) => boolean,
 *     (arg: X6) => boolean,
 *   ],
 * ) => void}
 */
const assertInput6 = assertInput;

/**
 * @type {<X1, X2, X3, X4, X5, X6, X7>(
 *   input: [X1, X2, X3, X4, X5, X6, X7],
 *   predicates: [
 *     (arg: X1) => boolean,
 *     (arg: X2) => boolean,
 *     (arg: X3) => boolean,
 *     (arg: X4) => boolean,
 *     (arg: X5) => boolean,
 *     (arg: X6) => boolean,
 *     (arg: X7) => boolean,
 *   ],
 * ) => void}
 */
const assertInput7 = assertInput;

////////////
// Aspect //
////////////

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
 * @type {(
 *   reflect: {
 *     apply: (
 *       callee: Value,
 *       that: Value,
 *       input: Value[],
 *     ) => Value,
 *     construct: (
 *       callee: Value,
 *       input: Value[],
 *     ) => Value,
 *   },
 * ) => import("aran").FlexibleAspect<
 *   Point,
 *   State,
 *   Value,
 *   Atom,
 *   JavaScriptIdentifier,
 * >}
 */
const compileAspect = ({ apply, construct }) => ({
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
      assertInput4(input, [isState, isAspectKind, isSegmentBlockType, isHash]);
    },
  },
  [toGlobalVariable("block@throwing")]: {
    kind: "block@throwing",
    pointcut: compilePointcut("block@throwing"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isValue,
        isAspectKind,
        isBlockType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toGlobalVariable("block@teardown")]: {
    kind: "block@teardown",
    pointcut: compilePointcut("block@teardown"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isBlockType, isHash]);
    },
  },
  [toGlobalVariable("statement@before")]: {
    kind: "statement@before",
    pointcut: compilePointcut("statement@before"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isStatementType, isHash]);
    },
  },
  [toGlobalVariable("statement@after")]: {
    kind: "statement@after",
    pointcut: compilePointcut("statement@after"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isStatementType, isHash]);
    },
  },
  [toGlobalVariable("effect@before")]: {
    kind: "effect@before",
    pointcut: compilePointcut("effect@before"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isEffectType, isHash]);
    },
  },
  [toGlobalVariable("effect@after")]: {
    kind: "effect@after",
    pointcut: compilePointcut("effect@after"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isEffectType, isHash]);
    },
  },
  [toGlobalVariable("expression@before")]: {
    kind: "expression@before",
    pointcut: compilePointcut("expression@before"),
    advice: (...input) => {
      assertInput4(input, [isState, isAspectKind, isExpressionType, isHash]);
    },
  },
  [toGlobalVariable("expression@after")]: {
    kind: "expression@after",
    pointcut: compilePointcut("expression@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isValue,
        isAspectKind,
        isExpressionType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toGlobalVariable("eval@before")]: {
    kind: "eval@before",
    pointcut: compilePointcut("eval@before"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isValue,
        isAspectKind,
        isEvalExpressionType,
        isHash,
      ]);
      /** @type {import("aran").Program<Atom>} */
      const root1 = /** @type {any} */ (input[1]);
      // eslint-disable-next-line no-use-before-define
      const root2 = weaveFlexible(root1, weave_config);
      return /** @type {Value} */ (/** @type {unknown} */ (root2));
    },
  },
  [toGlobalVariable("apply@around")]: {
    kind: "apply@around",
    pointcut: compilePointcut("apply@around"),
    advice: (...input) => {
      assertInput7(input, [
        isState,
        isValue,
        isValue,
        isValueArray,
        isAspectKind,
        isExpressionType,
        isHash,
      ]);
      return apply(input[1], input[2], input[3]);
    },
  },
  [toGlobalVariable("construct@around")]: {
    kind: "construct@around",
    pointcut: compilePointcut("construct@around"),
    advice: (...input) => {
      assertInput6(input, [
        isState,
        isValue,
        isValueArray,
        isAspectKind,
        isExpressionType,
        isHash,
      ]);
      return construct(input[1], input[2]);
    },
  },
});

////////////
// Config //
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

/**
 * @type {import("aran").TransConfig<Hash, FilePath>}
 */
const trans_config = {
  global_declarative_record: "builtin",
  digest,
};

/**
 * @type {import("aran").RetroConfig<JavaScriptIdentifier>}
 */
const retro_config = {
  mode: "normal",
  escape_prefix: /** @type {JavaScriptIdentifier} */ ("$aran"),
  global_object_variable: /** @type {JavaScriptIdentifier} */ ("globalThis"),
  intrinsic_global_variable: /** @type {JavaScriptIdentifier} */ (
    "__aran_intrinsic__"
  ),
};

const { setup, trans, retro } = compileAran(
  { ...trans_config, ...retro_config },
  toEvalPath,
);

/**
 * @type {import("aran").FlexibleWeaveConfig<
 *   Point,
 *   State,
 *   Atom,
 *   JavaScriptIdentifier,
 * >}
 */
const weave_config = {
  initial_state: STATE,
  pointcut: compileAspect({
    apply: () => {
      throw new AranTestError({ message: "dummy-apply" });
    },
    construct: () => {
      throw new AranTestError({ message: "dummy-construct" });
    },
  }),
};

////////////
// Export //
////////////

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["flex-void"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    const global = intrinsics["aran.global"];
    const aspect = compileAspect(/** @type {any} */ (global.Reflect));
    for (const variable of listKey(aspect)) {
      defineProperty(global, variable, {
        // @ts-ignore
        __proto__: null,
        value: /** @type {{advice: Function}} */ (aspect[variable]).advice,
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
  },
  instrument: ({ type, kind, path, content: code1 }) => {
    if (type === "main") {
      /** @type {import("aran").Program<Atom>} */
      const root1 = trans(path, kind, code1);
      const root2 = weaveFlexible(root1, weave_config);
      const code2 = retro(root2);
      return record({ path, content: code2 });
    } else {
      return record({ path, content: code1 });
    }
  },
};
