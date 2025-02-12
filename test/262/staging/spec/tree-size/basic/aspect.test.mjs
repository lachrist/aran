import { deepStrictEqual as assertDeepEqual } from "node:assert";
import { parse } from "acorn";
import { generate } from "astring";
import { setupile, transpile, retropile } from "aran";
import { advice_global_variable, weave, createAdvice } from "./aspect.mjs";

const { Error, SyntaxError, Reflect, eval: evalGlobal, Function } = globalThis;

/**
 * @typedef {{
 *   size: number,
 *   kind: import("aran").TestKind,
 *   tag: string,
 * }} Branch
 */

/**
 * @type {(
 *   advice: null | object,
 * ) => void}
 */
const setAdvice = (advice) => {
  /** @type {any} */ (globalThis)[advice_global_variable] = advice;
};

setAdvice(null);

/**
 * @type {import("aran").Digest}
 */
const digest = (_node, node_path, _file_path, _node_kind) => node_path;

/**
 * @type {(
 *   global_declarative_record: "builtin" | "emulate",
 * ) => (
 *   path: string,
 *   kind: "script" | "module" | "eval",
 *   code: string,
 * ) => import("aran").Program<import("aran").Atom & { Tag: string} >}
 */
const compileTrans = (global_declarative_record) => (path, kind, code) =>
  transpile(
    {
      kind,
      path,
      root: parse(code, {
        sourceType: kind === "eval" ? "script" : kind,
        ecmaVersion: "latest",
      }),
    },
    { digest, global_declarative_record },
  );

/**
 * @type {(
 *   root: import("aran").Program,
 * ) => string}
 */
const retro = (root) => generate(retropile(root, { mode: "normal" }));

/**
 * @type {(
 *   code: string,
 *   config: {
 *     include: "*" | "main",
 *     procedural: "inter" | "intra",
 *   },
 * ) => Branch[]}
 */
const test = (code, { procedural, include }) => {
  const trans = compileTrans(include === "*" ? "emulate" : "builtin");
  /** @type {import("aran").IntrinsicRecord} */
  const intrinsics = evalGlobal(generate(setupile({})));
  intrinsics["aran.transpileEvalCode"] = (/** @type {string} */ code) =>
    trans("dynamic://eval/local", "eval", code);
  intrinsics["aran.retropileEvalCode"] = retro;
  /** @type {Branch[]} */
  const branches = [];
  setAdvice(
    createAdvice(
      {
        apply: /** @type {(target: any, that: any, input: any[]) => any} */ (
          Reflect.apply
        ),
        construct: /** @type {(target: any, input: any[]) => any} */ (
          Reflect.construct
        ),
        getValueProperty: /** @type {(obj: any, key: any) => any} */ (
          intrinsics["aran.getValueProperty"]
        ),
        createArray: /** @type {(...values: any[]) => any} */ (
          (values) => values
        ),
        // eslint-disable-next-line object-shorthand
        Function: /** @type {any} */ (Function),
        evalGlobal,
        evalScript: (_code) => {
          throw new Error("evalScript");
        },
      },
      {
        instrument_dynamic_code: include === "*",
        SyntaxError,
        procedural,
        recordBranch: (kind, size, tag) => {
          branches.push({ kind, size, tag });
        },
        record_directory: null,
        trans,
        retro,
      },
    ),
  );
  evalGlobal(retro(weave(trans("main", "eval", code))));
  return branches;
};

/**
 * @type {(
 *   config: {
 *     procedural: "inter" | "intra",
 *     include: "*" | "main",
 *   },
 * ) => void}
 */
const testSuite = ({ procedural, include }) => {
  // literal //
  assertDeepEqual(test("(5 ? null : null);", { procedural, include }), [
    { kind: "conditional", size: /* 5 */ 1, tag: "$.body.0.expression" },
  ]);
  // object //
  assertDeepEqual(test("(({}) ? null : null);", { procedural, include }), [
    { kind: "conditional", size: 0, tag: "$.body.0.expression" },
  ]);
  // performBinary //
  assertDeepEqual(test("(2 + 3 ? null : null);", { procedural, include }), [
    {
      kind: "conditional",
      size:
        /* apply offset (performBinary) */ 1 +
        /* this = undefined */ 1 +
        /* arg0 = "+" */ 1 +
        /* arg1 = 2 */ 1 +
        /* arg2 = 3 */ 1,
      tag: "$.body.0.expression",
    },
  ]);
  // performBinary && performBinary //
  assertDeepEqual(test("(1 + 2 + 3 ? null : null);", { procedural, include }), [
    {
      kind: "conditional",
      size:
        /* apply offset (performBinary) */ 1 +
        /* this = undefined */ 1 +
        /* arg0 = "+" */ 1 +
        /* arg1 = 1 */ 1 +
        /* arg2 = 5 */ 0 +
        (0 +
          /* apply offset (performBinary) */ 1 +
          /* this = undefined */ 1 +
          /* arg0 = "+" */ 1 +
          /* arg1 = 2 */ 1 +
          /* arg2 = 3 */ 1 +
          0),
      tag: "$.body.0.expression",
    },
  ]);
  // getValueProperty(object) //
  assertDeepEqual(
    test("(({foo: 123}).foo ? null : null);", { procedural, include }),
    [
      {
        kind: "conditional",
        size:
          /* apply offset (getValueProperty) */ 1 +
          /* this = undefined */ 1 +
          /* arg1 = {foo:123} */ 0 +
          /* arg2 = "foo" */ 1,
        tag: "$.body.0.expression",
      },
    ],
  );
  // getValueProperty(array) //
  assertDeepEqual(test("([123][0] ? null : null);", { procedural, include }), [
    {
      kind: "conditional",
      size:
        /* apply offset (getValueProperty) */ 1 +
        /* this = undefined */ 1 +
        /* arg1 = [123] */ 0 +
        /* arg2 = 0 */ 1,
      tag: "$.body.0.expression",
    },
  ]);
  // inter-procedural argument tracking //
  assertDeepEqual(
    test("{ const f = (x) => (x ? null : null); f(2 + 3); }", {
      procedural,
      include,
    }),
    [
      {
        kind: "conditional",
        size: 3,
        tag: "$.body.0.body.0.declarations.0.init.params.0",
      },
      {
        kind: "conditional",
        size: 3 + (procedural === "inter" ? 5 : 0),
        tag: "$.body.0.body.0.declarations.0.init.body",
      },
    ],
  );
  // inter-procedural result tracking //
  assertDeepEqual(
    test("{ const f = () => 2 + 3; (f() ? null : null); }", {
      procedural,
      include,
    }),
    [
      {
        kind: "conditional",
        size: 2 + (procedural === "inter" ? 5 : 0),
        tag: "$.body.0.body.1.expression",
      },
    ],
  );
  // inter-procedural result tracking //
  assertDeepEqual(
    test("{ const f = () => 2 + 3; (f() ? null : null); }", {
      procedural,
      include,
    }),
    [
      {
        kind: "conditional",
        size: 2 + (procedural === "inter" ? 5 : 0),
        tag: "$.body.0.body.1.expression",
      },
    ],
  );
  // dynamic code >> local eval //
  assertDeepEqual(
    test("eval('(5 ? null : null);');", { procedural, include }),
    [
      ...(include === "*"
        ? [
            {
              kind: "conditional",
              size: /* has declarative record */ 3,
              tag: "$.body.0.expression",
            },
            {
              kind: "conditional",
              size: /* has global object */ 3,
              tag: "$.body.0.expression",
            },
          ]
        : []),
      {
        kind: "conditional",
        size: /* eval === intrinsics.eval */ 3,
        tag: "$.body.0.expression",
      },
      {
        kind: "conditional",
        size: /* typeof arg0 === "string" */ 8,
        tag: "$.body.0.expression",
      },
      { kind: "conditional", size: /* 5 */ 1, tag: "$.body.0.expression" },
    ],
  );
  // dynamic code >> global eval //
  assertDeepEqual(
    test("this.eval('(5 ? null : null);');", { procedural, include }),
    include === "*"
      ? [{ kind: "conditional", size: /* 5 */ 1, tag: "$.body.0.expression" }]
      : [],
  );
  // dynamic code >> Function //
  assertDeepEqual(
    test(
      "((new this.Function('x', 'y', 'return x + y;')(2, 3)) ? null : null);",
      {
        procedural,
        include,
      },
    ),
    include === "main"
      ? [{ kind: "conditional", size: /* 5 */ 4, tag: "$.body.0.expression" }]
      : [
          { kind: "conditional", size: 1, tag: "$.body.0.expression" },
          { kind: "conditional", size: 5, tag: "$.body.0.expression" },
          { kind: "conditional", size: 3, tag: "$.body.0.expression.params.0" },
          { kind: "conditional", size: 3, tag: "$.body.0.expression.params.1" },
          { kind: "conditional", size: 1, tag: "$.body.0.expression" },
          {
            kind: "conditional",
            size: procedural === "inter" ? 15 : 4,
            tag: "$.body.0.expression",
          },
        ],
  );
};

testSuite({ procedural: "intra", include: "main" });
testSuite({ procedural: "intra", include: "*" });
testSuite({ procedural: "inter", include: "main" });
testSuite({ procedural: "inter", include: "*" });
