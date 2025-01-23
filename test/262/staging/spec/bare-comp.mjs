/* eslint-disable local/no-jsdoc-typedef */
/* eslint-disable no-use-before-define */

import { compileAran } from "../aran.mjs";
import { AranTypeError } from "../../error.mjs";
import { recreateError } from "../../util/index.mjs";
import { record } from "../../record/index.mjs";

/**
 * @typedef {string & {__brand: "NodeHash"}} NodeHash
 * @typedef {string & {__brand: "FilePath"}} FilePath
 * @typedef {import("aran").Atom & { Tag: NodeHash }} Atom
 */

const {
  Array: {
    from: toArray,
    prototype: { pop, join },
  },
  Reflect: { apply, defineProperty },
  String,
} = globalThis;

//////////
// Util //
//////////

/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (element: X) => Y
 * ) => Y[]}
 */
const map = toArray;

/**
 * @type {<X>(
 *   array: X[],
 * ) => X[]}
 */
const copy = toArray;

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
 * @type {["eval", "apply", "construct"]}
 */
const ADVICE = ["eval", "apply", "construct"];

/**
 * @type {(
 *   name: "eval" | "apply" | "construct",
 * ) => string}
 */
const toAdviceVariable = (name) => `advice.${name}`;

/**
 * @type {(
 *   name: "eval" | "apply" | "construct",
 * ) => string}
 */
const toAdviceGlobal = (name) => `_aran_${name}`;

/**
 * @type {(
 *   name: "eval" | "apply" | "construct",
 * ) => [string, "undefined"]}
 */
const toAdviceEntry = (name) => [toAdviceVariable(name), "undefined"];

/**
 * @type {(
 *   name: "eval" | "apply" | "construct",
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
        intrinsic: "aran.get",
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
          intrinsic: "aran.global",
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
 *   input: unknown[],
 * ) => string}
 */
const compileFunctionCode = (input) => {
  if (input.length === 0) {
    return "(function anonymous() {\n})";
  } else {
    input = copy(input);
    const body = apply(pop, input, []);
    const params = apply(join, map(input, String), [","]);
    return `(function anonymous(${params}\n) {\n${body}\n})`;
  }
};

/**
 * @type {(
 *   intrinsic: import("aran").IntrinsicRecord,
 * ) => {
 *   eval: (
 *     root: import("aran").Program<Atom>,
 *   ) => import("aran").Program<Atom>,
 *   apply: (
 *     callee: Function,
 *     that: unknown,
 *     args: unknown[],
 *     hash: string,
 *   ) => unknown,
 *   construct: (
 *     construct: Function,
 *     args: unknown[],
 *     hash: string,
 *   ) => unknown,
 * }}
 */
const compileAdvice = (intrinsics) => {
  const global = intrinsics["aran.global"];
  const globals = {
    apply: global.Reflect.apply,
    construct: global.Reflect.construct,
    SyntaxError: global.SyntaxError,
    eval: global.eval,
    Function: global.Function,
    evalScript: /** @type {{$262: import("../../$262").$262}} */ (
      /** @type {unknown} */ (global)
    ).$262.evalScript,
  };
  const syntax_error_mapping = {
    SyntaxError: globals.SyntaxError,
    AranSyntaxError: globals.SyntaxError,
  };
  return {
    eval: weave,
    apply: (callee, that, input, hash) => {
      if (callee === globals.eval && input.length > 0) {
        const code = input[0];
        if (typeof code === "string") {
          try {
            const path = /** @type {FilePath} */ (
              `dynamic://eval/global/${hash}`
            );
            const { content } = record({
              path,
              content: retro(weave(trans(path, "eval", code))),
            });
            return globals.eval(content);
          } catch (error) {
            throw recreateError(error, syntax_error_mapping);
          }
        }
      }
      if (callee === globals.evalScript && input.length > 0) {
        const code = String(input[0]);
        try {
          const path = /** @type {FilePath} */ (
            `dynamic://script/global/${hash}`
          );
          const { content } = record({
            path,
            content: retro(weave(trans(path, "script", code))),
          });
          return globals.evalScript(content);
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return globals.apply(callee, that, input);
    },
    construct: (callee, input, hash) => {
      if (callee === globals.Function) {
        try {
          const path = /** @type {FilePath} */ (
            `dynamic://function/global/${hash}`
          );
          const { content } = record({
            path,
            content: retro(
              weave(trans(path, "eval", compileFunctionCode(input))),
            ),
          });
          return globals.eval(content);
        } catch (error) {
          throw recreateError(error, syntax_error_mapping);
        }
      }
      return globals.construct(callee, input, callee);
    },
  };
};

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
  bindings: concat(node.bindings, map(ADVICE, toAdviceEntry)),
  head: null,
  body: concat(
    map(ADVICE, (name) => toAdviceInit(name, node.tag)),
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
            primitive: tag,
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
            primitive: tag,
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

const { setup, trans, retro } = compileAran(
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

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["parsing"],
  negative: [
    "async-iterator-async-value",
    "arguments-two-way-binding",
    "function-dynamic-property",
    "negative-bare-unknown",
    "negative-bare-duplicate-super-prototype-access",
    "negative-bare-early-module-declaration",
    "negative-bare-missing-iterable-return-in-pattern",
    "negative-bare-wrong-realm-for-default-prototype",
  ],
  exclude: [
    // function-string-representation is flaky
    "function-string-representation",
    // module-literal-specifier tests may pass because literal specifier are
    // consistently replaced with undefined but they should be marked as failure.
    "module-literal-specifier",
  ],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    const advice = compileAdvice(intrinsics);
    for (let index = 0; index < ADVICE.length; index += 1) {
      const name = ADVICE[index];
      defineProperty(intrinsics["aran.global"], toAdviceGlobal(name), {
        // @ts-ignore
        __proto__: null,
        value: advice[name],
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }
  },
  instrument: ({ kind, path, content }) =>
    record({
      path,
      content: retro(
        weave(trans(/** @type {FilePath} */ (path), kind, content)),
      ),
    }),
};
