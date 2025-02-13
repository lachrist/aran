/* eslint-disable no-use-before-define */

import { open } from "node:fs/promises";
import { compileAran } from "../../aran.mjs";
import { AranTypeError } from "../../../error.mjs";
import { record } from "../../../record/index.mjs";
import { compileListPrecursorFailure } from "../../failure.mjs";
import {
  compileInterceptEval,
  listEntry,
  listKey,
  map,
} from "../../helper.mjs";

const {
  URL,
  Array: { from: toArray },
  Reflect: { defineProperty },
} = globalThis;

/**
 * @typedef {(
 *   | "branch"
 *   | "eval"
 *   | "apply"
 *   | "construct"
 * )} AdviceName
 * @typedef {string & {__brand: "NodeHash"}} NodeHash
 * @typedef {string & {__brand: "FilePath"}} FilePath
 * @typedef {import("aran").Atom & { Tag: NodeHash }} Atom
 */

//////////
// Util //
//////////

/**
 * @type {<X>(
 *   array1: X[],
 *   array2: X[],
 * ) => X[]}
 */
const concat = (array1, array2) => {
  const { length: length1 } = array1;
  const { length: length2 } = array2;
  return toArray(
    /** @type {{length: number}} */ ({
      __proto__: null,
      length: length1 + length2,
    }),
    (_, index) => (index < length1 ? array1[index] : array2[index - length1]),
  );
};

////////////
// Advice //
////////////

/**
 * @type {{[key in AdviceName]: null}}
 */
const advice_record = {
  branch: null,
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

/**
 * @type {(
 *   config: {
 *     instrument_dynamic_code: boolean,
 *   },
 * ) => (
 *   root: import("aran").Program<Atom>,
 * ) => import("aran").Program<Atom>}
 */
const compileWeave = ({ instrument_dynamic_code }) => {
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
  const visitStatement = (node) => {
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
          test: {
            type: "ApplyExpression",
            callee: {
              type: "ReadExpression",
              variable: toAdviceVariable("branch"),
              tag,
            },
            this: {
              type: "IntrinsicExpression",
              intrinsic: "undefined",
              tag,
            },
            arguments: [visitExpression(node.test)],
            tag,
          },
          then: visitSegmentBlock(node.then),
          else: visitSegmentBlock(node.else),
          tag,
        };
      }
      case "WhileStatement": {
        return {
          type: "WhileStatement",
          test: {
            type: "ApplyExpression",
            callee: {
              type: "ReadExpression",
              variable: toAdviceVariable("branch"),
              tag,
            },
            this: {
              type: "IntrinsicExpression",
              intrinsic: "undefined",
              tag,
            },
            arguments: [visitExpression(node.test)],
            tag,
          },
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
  const visitEffect = (node) => {
    const { tag } = node;
    switch (node.type) {
      case "ConditionalEffect": {
        return {
          type: "ConditionalEffect",
          test: {
            type: "ApplyExpression",
            callee: {
              type: "ReadExpression",
              variable: toAdviceVariable("branch"),
              tag,
            },
            this: {
              type: "IntrinsicExpression",
              intrinsic: "undefined",
              tag,
            },
            arguments: [visitExpression(node.test)],
            tag,
          },
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
  const visitExpression = (node) => {
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
          test: {
            type: "ApplyExpression",
            callee: {
              type: "ReadExpression",
              variable: toAdviceVariable("branch"),
              tag,
            },
            this: {
              type: "IntrinsicExpression",
              intrinsic: "undefined",
              tag,
            },
            arguments: [visitExpression(node.test)],
            tag,
          },
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
        if (instrument_dynamic_code) {
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
        } else {
          return {
            type: "ApplyExpression",
            callee: visitExpression(node.callee),
            this: visitExpression(node.this),
            arguments: map(node.arguments, visitExpression),
            tag,
          };
        }
      }
      case "ConstructExpression": {
        if (instrument_dynamic_code) {
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
        } else {
          return {
            type: "ConstructExpression",
            callee: visitExpression(node.callee),
            arguments: map(node.arguments, visitExpression),
            tag,
          };
        }
      }
      default: {
        throw new AranTypeError(node);
      }
    }
  };
  return visitProgram;
};

////////////
// Config //
////////////

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

/**
 * @type {(
 *   config: {
 *     include: "comp" | "main",
 *   },
 * ) => Promise<
 *   import("../../stage").Stage<
 *     import("../../stage").Config & {
 *       handle: import("node:fs/promises").FileHandle,
 *     },
 *     import("../../stage").Config & {
 *       handle: import("node:fs/promises").FileHandle,
 *       counter: { inner: number },
 *     },
 *   >
 * >}
 */
export const createStage = async ({ include }) => {
  const listPrecursorFailure = await compileListPrecursorFailure([
    `linvail/stage-stnd-${include}`,
  ]);
  const weave = compileWeave({ instrument_dynamic_code: include === "comp" });
  const { prepare, trans, retro } = compileAran(
    {
      mode: "normal",
      escape_prefix: "$aran",
      global_object_variable: "globalThis",
      intrinsic_global_variable: "__aran_intrinsic__",
      global_declarative_record: include === "comp" ? "emulate" : "builtin",
      digest,
    },
    toEvalPath,
  );
  return {
    open: async (config) => ({
      ...config,
      handle: await open(
        new URL(`stage-${include}-output.txt`, import.meta.url),
        "w",
      ),
    }),
    close: async ({ handle }) => {
      await handle.close();
    },
    setup: async (config, [index, _test]) => {
      const reasons = listPrecursorFailure(index);
      if (reasons.length > 0) {
        await config.handle.write("\n");
        return { type: "exclude", reasons };
      } else {
        return {
          type: "include",
          state: {
            ...config,
            counter: { inner: 0 },
          },
          flaky: false,
          negatives: [],
        };
      }
    },
    prepare: ({ counter, record_directory }, context) => {
      const { intrinsics } = prepare(context, { record_directory });
      const advice = {
        eval: weave,
        branch: (/** @type {unknown} */ test) => {
          counter.inner++;
          return test;
        },
        ...(include === "comp"
          ? compileInterceptEval({
              toEvalPath,
              weave,
              retro,
              trans,
              String: intrinsics.globalThis.String,
              SyntaxError: intrinsics.globalThis.SyntaxError,
              enterValue: (value) => value,
              leaveValue: (value) => value,
              apply: intrinsics.globalThis.Reflect.apply,
              construct: intrinsics.globalThis.Reflect.construct,
              evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
              evalScript: /** @type {any} */ (intrinsics.globalThis).$262
                .evalScript,
              Function: /** @type {any} */ (intrinsics.globalThis.Function),
              record_directory,
            })
          : {}),
      };
      for (const [key, val] of listEntry(advice)) {
        const descriptor = {
          __proto__: null,
          value: val,
          writable: false,
          enumerable: false,
          configurable: false,
        };
        defineProperty(
          intrinsics["aran.global_object"],
          toAdviceGlobal(key),
          descriptor,
        );
      }
    },
    instrument: ({ record_directory }, { type, kind, path, content }) => {
      if (include === "comp" || type === "main") {
        return record(
          {
            path,
            content: retro(
              weave(trans(/** @type {FilePath} */ (path), kind, content)),
            ),
          },
          record_directory,
        );
      } else {
        return record({ path, content }, record_directory);
      }
    },
    teardown: async ({ handle, counter }) => {
      await handle.write(`${counter.inner}\n`);
    },
  };
};
