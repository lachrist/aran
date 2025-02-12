/* eslint-disable no-use-before-define */

import { compileAran } from "../aran.mjs";
import { AranTypeError } from "../../error.mjs";
import { record } from "../../record/index.mjs";
import { compileListPrecursorFailure } from "../failure.mjs";
import { loadTaggingList } from "../../tagging/tagging.mjs";
import { toTestSpecifier } from "../../result.mjs";
import { compileInterceptEval, concat, listKey, map } from "../helper.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @typedef {"eval" | "apply" | "construct"} AdviceName
 * @typedef {string & {__brand: "NodeHash"}} NodeHash
 * @typedef {string & {__brand: "FilePath"}} FilePath
 * @typedef {import("aran").Atom & { Tag: NodeHash }} Atom
 */

////////////
// Advice //
////////////

/**
 * @type {{[key in AdviceName]: null}}
 */
const advice_record = {
  eval: null,
  apply: null,
  construct: null,
};

const advice_enum = listKey(advice_record);

/**
 * @type {(
 *   name: AdviceName,
 * ) => string}
 */
const toAdviceVariable = (name) => `advice.${name}`;

/**
 * @type {(
 *   name: AdviceName,
 * ) => string}
 */
const toAdviceGlobal = (name) => `_aran_${name}`;

/**
 * @type {(
 *   name: AdviceName,
 * ) => [string, "undefined"]}
 */
const toAdviceEntry = (name) => [toAdviceVariable(name), "undefined"];

/**
 * @type {(
 *   name: AdviceName,
 *   tag: NodeHash,
 * ) => import("aran").Statement<Atom>}
 */
const toAdviceInit = (name, tag) => ({
  type: "EffectStatement",
  inner: {
    type: "WriteEffect",
    variable: toAdviceVariable(name),
    value: {
      type: "ApplyExpression",
      callee: {
        type: "IntrinsicExpression",
        intrinsic: "aran.getValueProperty",
        tag,
      },
      this: {
        type: "IntrinsicExpression",
        intrinsic: "undefined",
        tag,
      },
      arguments: [
        {
          type: "IntrinsicExpression",
          intrinsic: "aran.global_object",
          tag,
        },
        {
          type: "PrimitiveExpression",
          primitive: toAdviceGlobal(name),
          tag,
        },
      ],
      tag,
    },
    tag,
  },
  tag,
});

///////////
// Visit //
///////////

/**
 * @type {(
 *   node: import("aran").Program<Atom>,
 * ) => import("aran").Program<Atom>}
 */
const visitProgram = (node) =>
  /** @type {import("aran").Program<Atom>} */ ({
    type: "Program",
    kind: node.kind,
    situ: node.situ,
    head: node.head,
    body: visitProgramBlock(node.body),
    tag: node.tag,
  });

/**
 * @type {(
 *   node: import("aran").RoutineBlock<Atom> & { head: null },
 * ) => import("aran").RoutineBlock<Atom> & { head: null }}
 */
const visitProgramBlock = (node) => ({
  type: "RoutineBlock",
  bindings: concat(node.bindings, map(advice_enum, toAdviceEntry)),
  head: null,
  body: concat(
    map(advice_enum, (name) => toAdviceInit(name, node.tag)),
    map(node.body, visitStatement),
  ),
  tail: visitExpression(node.tail),
  tag: node.tag,
});

/**
 * @type {(
 *   node: import("aran").RoutineBlock<Atom>,
 * ) => import("aran").RoutineBlock<Atom> & { head: any }}
 */
const visitClosureBlock = (node) => ({
  type: "RoutineBlock",
  bindings: node.bindings,
  head: node.head && map(node.head, visitEffect),
  body: map(node.body, visitStatement),
  tail: visitExpression(node.tail),
  tag: node.tag,
});

/**
 * @type {(
 *   node: import("aran").SegmentBlock<Atom>,
 * ) => import("aran").SegmentBlock<Atom>}
 */
const visitSegmentBlock = (node) => ({
  type: "SegmentBlock",
  labels: node.labels,
  bindings: node.bindings,
  body: map(node.body, visitStatement),
  tag: node.tag,
});

/**
 * @type {(
 *   node: import("aran").Statement<Atom>,
 * ) => import("aran").Statement<Atom>}
 */
export const visitStatement = (node) => {
  const { tag } = node;
  switch (node.type) {
    case "BreakStatement": {
      return node;
    }
    case "DebuggerStatement": {
      return node;
    }
    case "EffectStatement": {
      return {
        type: "EffectStatement",
        inner: visitEffect(node.inner),
        tag: node.tag,
      };
    }
    case "BlockStatement": {
      return {
        type: "BlockStatement",
        body: visitSegmentBlock(node.body),
        tag,
      };
    }
    case "IfStatement": {
      return {
        type: "IfStatement",
        test: visitExpression(node.test),
        then: visitSegmentBlock(node.then),
        else: visitSegmentBlock(node.else),
        tag,
      };
    }
    case "WhileStatement": {
      return {
        type: "WhileStatement",
        test: visitExpression(node.test),
        body: visitSegmentBlock(node.body),
        tag,
      };
    }
    case "TryStatement": {
      return {
        type: "TryStatement",
        try: visitSegmentBlock(node.try),
        catch: visitSegmentBlock(node.catch),
        finally: visitSegmentBlock(node.finally),
        tag,
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("aran").Effect<Atom>,
 * ) => import("aran").Effect<Atom>}
 */
export const visitEffect = (node) => {
  const { tag } = node;
  switch (node.type) {
    case "ConditionalEffect": {
      return {
        type: "ConditionalEffect",
        test: visitExpression(node.test),
        positive: map(node.positive, visitEffect),
        negative: map(node.negative, visitEffect),
        tag,
      };
    }
    case "ExportEffect": {
      return {
        type: "ExportEffect",
        export: node.export,
        value: visitExpression(node.value),
        tag,
      };
    }
    case "ExpressionEffect": {
      return {
        type: "ExpressionEffect",
        discard: visitExpression(node.discard),
        tag,
      };
    }
    case "WriteEffect": {
      return {
        type: "WriteEffect",
        variable: node.variable,
        value: visitExpression(node.value),
        tag,
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: import("aran").Expression<Atom>,
 * ) => import("aran").Expression<Atom>}
 */
export const visitExpression = (node) => {
  const { tag } = node;
  switch (node.type) {
    case "PrimitiveExpression": {
      return node;
    }
    case "ReadExpression": {
      return node;
    }
    case "ImportExpression": {
      return node;
    }
    case "IntrinsicExpression": {
      return node;
    }
    case "AwaitExpression": {
      return {
        type: "AwaitExpression",
        promise: visitExpression(node.promise),
        tag,
      };
    }
    case "YieldExpression": {
      return {
        type: "YieldExpression",
        delegate: node.delegate,
        item: visitExpression(node.item),
        tag,
      };
    }
    case "ConditionalExpression": {
      return {
        type: "ConditionalExpression",
        test: visitExpression(node.test),
        consequent: visitExpression(node.consequent),
        alternate: visitExpression(node.alternate),
        tag,
      };
    }
    case "SequenceExpression": {
      return {
        type: "SequenceExpression",
        head: map(node.head, visitEffect),
        tail: visitExpression(node.tail),
        tag,
      };
    }
    case "ClosureExpression": {
      if (node.kind === "generator") {
        return {
          type: "ClosureExpression",
          kind: node.kind,
          asynchronous: node.asynchronous,
          body: visitClosureBlock(node.body),
          tag,
        };
      } else {
        return {
          type: "ClosureExpression",
          kind: node.kind,
          asynchronous: node.asynchronous,
          body: visitClosureBlock(node.body),
          tag,
        };
      }
    }
    case "EvalExpression": {
      return {
        type: "EvalExpression",
        code: {
          type: "ApplyExpression",
          callee: {
            type: "ReadExpression",
            variable: toAdviceVariable("eval"),
            tag,
          },
          this: {
            type: "IntrinsicExpression",
            intrinsic: "undefined",
            tag,
          },
          arguments: [visitExpression(node.code)],
          tag,
        },
        tag,
      };
    }
    case "ApplyExpression": {
      return {
        type: "ApplyExpression",
        callee: {
          type: "ReadExpression",
          variable: toAdviceVariable("apply"),
          tag,
        },
        this: {
          type: "IntrinsicExpression",
          intrinsic: "undefined",
          tag,
        },
        arguments: [
          visitExpression(node.callee),
          visitExpression(node.this),
          {
            type: "ApplyExpression",
            callee: {
              type: "IntrinsicExpression",
              intrinsic: "Array.of",
              tag,
            },
            this: {
              type: "IntrinsicExpression",
              intrinsic: "undefined",
              tag,
            },
            arguments: map(node.arguments, visitExpression),
            tag,
          },
          {
            type: "PrimitiveExpression",
            primitive: node.tag,
            tag,
          },
        ],
        tag,
      };
    }
    case "ConstructExpression": {
      return {
        type: "ApplyExpression",
        callee: {
          type: "ReadExpression",
          variable: toAdviceVariable("construct"),
          tag,
        },
        this: {
          type: "IntrinsicExpression",
          intrinsic: "undefined",
          tag,
        },
        arguments: [
          visitExpression(node.callee),
          {
            type: "ApplyExpression",
            callee: {
              type: "IntrinsicExpression",
              intrinsic: "Array.of",
              tag,
            },
            this: {
              type: "IntrinsicExpression",
              intrinsic: "undefined",
              tag,
            },
            arguments: map(node.arguments, visitExpression),
            tag,
          },
          {
            type: "PrimitiveExpression",
            primitive: node.tag,
            tag,
          },
        ],
        tag,
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

////////////
// Config //
////////////

const weave = visitProgram;

/**
 * @type {import("aran").Digest<{NodeHash: NodeHash, FilePath: FilePath}>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  /** @type {NodeHash} */ (`${file_path}:${node_path}`);

/**
 * @type {(hash: NodeHash) => FilePath}
 */
const toEvalPath = (hash) =>
  /** @type {FilePath} */ (`dynamic://eval/local/${hash}`);

const { prepare, trans, retro } = compileAran(
  {
    mode: "normal",
    escape_prefix: "$aran",
    global_object_variable: "globalThis",
    intrinsic_global_variable: "__aran_intrinsic__",
    global_declarative_record: "emulate",
    digest,
  },
  toEvalPath,
);

const listNegative = await loadTaggingList([
  "async-iterator-async-value",
  "arguments-two-way-binding",
  "function-dynamic-property",
  "negative-bare-unknown",
  "negative-bare-duplicate-super-prototype-access",
  "negative-bare-early-module-declaration",
  "negative-bare-missing-iterable-return-in-pattern",
  "negative-bare-wrong-realm-for-default-prototype",
]);

const listPrecursorFailure = await compileListPrecursorFailure(["parsing"]);

const listExclusionReason = await loadTaggingList([
  // function-string-representation is flaky
  "function-string-representation",
  // module-literal-specifier tests may pass because literal specifier are
  // consistently replaced with undefined but they should be marked as failure.
  "module-literal-specifier",
]);

/**
 * @type {import("../stage").Stage<
 *   import("../stage").Config,
 *   import("../stage").Config,
 * >}
 */
export default {
  // eslint-disable-next-line require-await
  open: async (config) => config,
  close: async (_config) => {},
  // eslint-disable-next-line require-await
  setup: async (config, [index, test]) => {
    const specifier = toTestSpecifier(test.path, test.directive);
    const reasons = [
      ...listPrecursorFailure(index),
      ...listExclusionReason(specifier),
    ];
    if (reasons.length > 0) {
      return { type: "exclude", reasons };
    } else {
      return {
        type: "include",
        state: config,
        flaky: false,
        negatives: listNegative(specifier),
      };
    }
  },
  prepare: ({ record_directory }, context) => {
    const { intrinsics } = prepare(context, { record_directory });
    const advice = {
      eval: weave,
      ...compileInterceptEval({
        toEvalPath,
        weave,
        retro,
        trans,
        leaveValue: (value) => value,
        enterValue: (value) => value,
        Function: intrinsics.globalThis.Function,
        String: intrinsics.globalThis.String,
        SyntaxError: intrinsics.globalThis.SyntaxError,
        evalGlobal: intrinsics.globalThis.eval,
        evalScript: /** @type {any} */ (intrinsics.globalThis).$262.evalScript,
        record_directory,
        apply: intrinsics.globalThis.Reflect.apply,
        construct: intrinsics.globalThis.Reflect.construct,
      }),
    };
    for (let index = 0; index < advice_enum.length; index += 1) {
      const name = advice_enum[index];
      const descriptor = {
        __proto__: null,
        value: advice[name],
        writable: false,
        enumerable: false,
        configurable: false,
      };
      defineProperty(
        intrinsics["aran.global_object"],
        toAdviceGlobal(name),
        descriptor,
      );
    }
  },
  instrument: (config, { kind, path, content }) =>
    record(
      {
        path,
        content: retro(
          weave(trans(/** @type {FilePath} */ (path), kind, content)),
        ),
      },
      config.record_directory,
    ),
  teardown: async (_state) => {},
};
