import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { AranTestError } from "../../error.mjs";
import { record } from "../../record/index.mjs";
import { listStageFailure } from "../failure.mjs";
import { toTestSpecifier } from "../../result.mjs";

const {
  Array: { isArray },
  Reflect: { apply, getPrototypeOf, defineProperty },
  String: {
    prototype: { startsWith },
  },
  Object: { hasOwn, keys },
} = globalThis;

/**
 * @typedef {`hash:${string}`} NodeHash
 * @typedef {[
 *   import("aran").FlexibleAspectKind,
 *   import("aran").Node["type"],
 *   import("aran").Node["type"],
 *   NodeHash,
 * ]} Point
 * @typedef {`dynamic://eval/local/${NodeHash}`} LocalEvalPath
 * @typedef {(
 *   | import("../../fetch").HarnessName
 *   | import("../../fetch").DependencyPath
 *   | import("../../fetch").TestPath
 *   | LocalEvalPath
 * )} FilePath
 * @typedef {string & {__brand: "AdviceGlobalVariable"}} AdviceGlobalVariable
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
 *   Tag: NodeHash,
 * }} Atom
 * @typedef {unknown & {__brand: "Value"}} Value
 * @typedef {"@state"} State
 */

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
  "block@setup": null,
  "block@before": null,
  "block@declaration": null,
  "block@declaration-overwrite": null,
  "block@after": null,
  "block@throwing": null,
  "block@teardown": null,
  "statement@before": null,
  "statement@after": null,
  "effect@before": null,
  "effect@after": null,
  "expression@before": null,
  "expression@after": null,
  "apply@around": null,
  "construct@around": null,
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

/**
 * @type {{
 *   [key in import("aran").Node["type"]]: null
 * }}
 */
const NODE_TYPE_ENUM = {
  Program: null,
  RoutineBlock: null,
  SegmentBlock: null,
  ...STATEMENT_NODE_TYPE_ENUM,
  ...EFFECT_NODE_TYPE_ENUM,
  ...EXPRESSION_NODE_TYPE_ENUM,
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
const isNodeType = (type) => hasOwn(NODE_TYPE_ENUM, type);

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
 *   hash: NodeHash,
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
    throw new AranTestError("assertion failure", { actual, expect });
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
    throw new AranTestError("assertion failure", {
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

/**
 * @type {<X1, X2, X3, X4, X5, X6, X7, X8>(
 *   input: [X1, X2, X3, X4, X5, X6, X7, X8],
 *   predicates: [
 *     (arg: X1) => boolean,
 *     (arg: X2) => boolean,
 *     (arg: X3) => boolean,
 *     (arg: X4) => boolean,
 *     (arg: X5) => boolean,
 *     (arg: X6) => boolean,
 *     (arg: X7) => boolean,
 *     (arg: X8) => boolean,
 *   ],
 * ) => void}
 */
const assertInput8 = assertInput;

////////////
// Aspect //
////////////

/**
 * @type {(
 *   kind: import("aran").FlexibleAspectKind,
 * ) => AdviceGlobalVariable}
 */
const toAdviceGlobalVariable = (kind) =>
  /** @type {AdviceGlobalVariable} */ (
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
  return [kind, node.type, parent.type, node.tag];
};

/**
 * @type {(
 *   Reflect: {
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
 * ) => import("aran").FlexibleAspect<Atom & {
 *   AdviceGlobalVariable: AdviceGlobalVariable,
 *   Point: Point,
 *   State: State,
 *   Value: Value,
 * }>}
 */
const compileAspect = ({ apply, construct }) => ({
  [toAdviceGlobalVariable("block@setup")]: {
    kind: "block@setup",
    pointcut: compilePointcut("block@setup"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
      return STATE;
    },
  },
  [toAdviceGlobalVariable("block@before")]: {
    kind: "block@before",
    pointcut: compilePointcut("block@before"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("block@declaration")]: {
    kind: "block@declaration",
    pointcut: compilePointcut("block@declaration"),
    advice: (...input) => {
      assertInput6(input, [
        isState,
        isFrame,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("block@declaration-overwrite")]: {
    kind: "block@declaration-overwrite",
    pointcut: compilePointcut("block@declaration-overwrite"),
    advice: (...input) => {
      assertInput6(input, [
        isState,
        isFrame,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toAdviceGlobalVariable("block@after")]: {
    kind: "block@after",
    pointcut: compilePointcut("block@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("block@throwing")]: {
    kind: "block@throwing",
    pointcut: compilePointcut("block@throwing"),
    advice: (...input) => {
      assertInput6(input, [
        isState,
        isValue,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
      return input[1];
    },
  },
  [toAdviceGlobalVariable("block@teardown")]: {
    kind: "block@teardown",
    pointcut: compilePointcut("block@teardown"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isBlockType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("statement@before")]: {
    kind: "statement@before",
    pointcut: compilePointcut("statement@before"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isStatementType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("statement@after")]: {
    kind: "statement@after",
    pointcut: compilePointcut("statement@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isStatementType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("effect@before")]: {
    kind: "effect@before",
    pointcut: compilePointcut("effect@before"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isEffectType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("effect@after")]: {
    kind: "effect@after",
    pointcut: compilePointcut("effect@after"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isEffectType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("expression@before")]: {
    kind: "expression@before",
    pointcut: compilePointcut("expression@before"),
    advice: (...input) => {
      assertInput5(input, [
        isState,
        isAspectKind,
        isExpressionType,
        isNodeType,
        isHash,
      ]);
    },
  },
  [toAdviceGlobalVariable("expression@after")]: {
    kind: "expression@after",
    pointcut: compilePointcut("expression@after"),
    advice: (...input) => {
      assertInput6(input, [
        isState,
        isValue,
        isAspectKind,
        isExpressionType,
        isNodeType,
        isHash,
      ]);
      const { 1: result, 4: parent } = input;
      if (parent === "EvalExpression") {
        /** @type {import("aran").Program<Atom>} */
        const root1 = /** @type {any} */ (result);
        // eslint-disable-next-line no-use-before-define
        const root2 = weaveFlexible(root1, weave_config);
        return /** @type {Value} */ (/** @type {unknown} */ (root2));
      } else {
        return result;
      }
    },
  },
  [toAdviceGlobalVariable("apply@around")]: {
    kind: "apply@around",
    pointcut: compilePointcut("apply@around"),
    advice: (...input) => {
      assertInput8(input, [
        isState,
        isValue,
        isValue,
        isValueArray,
        isAspectKind,
        isExpressionType,
        isNodeType,
        isHash,
      ]);
      return apply(input[1], input[2], input[3]);
    },
  },
  [toAdviceGlobalVariable("construct@around")]: {
    kind: "construct@around",
    pointcut: compilePointcut("construct@around"),
    advice: (...input) => {
      assertInput7(input, [
        isState,
        isValue,
        isValueArray,
        isAspectKind,
        isExpressionType,
        isNodeType,
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
 * @type {import("aran").Digest<{
 *   NodeHash: NodeHash,
 *   FilePath: FilePath,
 * }>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  `hash:${file_path}:${node_path}`;

/**
 * @type {(hash: NodeHash) => FilePath}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

/**
 * @type {import("aran").TransConfig<{
 *   NodeHash: NodeHash,
 *   FilePath: FilePath,
 * }>}
 */
const trans_config = {
  global_declarative_record: "builtin",
  digest,
};

/**
 * @type {import("aran").RetroConfig<{
 *   JavaScriptIdentifier: JavaScriptIdentifier,
 * }>}
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
 * @type {import("aran").FlexiblePointcut<Atom & {
 *   AdviceGlobalVariable: AdviceGlobalVariable,
 *   Point: Point,
 * }>}
 */
const pointcut = compileAspect({
  apply: (...input) => {
    throw new AranTestError("dummy-apply", input);
  },
  construct: (...input) => {
    throw new AranTestError("dummy-construct", input);
  },
});

/**
 * @type {import("aran").FlexibleWeaveConfig<Atom & {
 *   InitialState: State,
 *   AdviceGlobalVariable: AdviceGlobalVariable,
 *   Point: Point,
 * }>}
 */
const weave_config = {
  initial_state: STATE,
  pointcut,
};

////////////
// Export //
////////////

const precursor = "flex-void";

const exclusion = await listStageFailure(precursor);

/**
 * @type {import("../stage").Stage<null>}
 */
export default {
  // eslint-disable-next-line require-await
  setup: async (test) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    if (exclusion.has(specifier)) {
      return {
        type: "exclude",
        reasons: [precursor],
      };
    } else {
      return {
        type: "include",
        state: null,
        flaky: false,
        negatives: [],
      };
    }
  },
  prepare: (_state, context) => {
    const { intrinsics } = setup(context);
    const global = intrinsics["aran.global_object"];
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
  teardown: async (_state) => {},
};
