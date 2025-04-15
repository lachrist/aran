import { deepStrictEqual as assertDeepEqual } from "node:assert";
import { parse } from "acorn";
import { generate } from "astring";
import { setupile, transpile, retropile } from "aran";
import {
  advice_global_variable,
  compileWeave,
  createAdvice,
} from "./track-basic-aspect.mjs";
import { toEvalPath, digest } from "./location.mjs";

const { Error, eval: evalGlobal } = globalThis;

/**
 * @typedef {{
 *   prov: number,
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
 * @type {(
 *   global_declarative_record: "builtin" | "emulate",
 * ) => (
 *   path: import("./track-basic-aspect.mjs").FilePath,
 *   kind: "script" | "module" | "eval",
 *   code: string,
 * ) => import("aran").Program<import("./track-basic-aspect.mjs").Atom>}
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
 *     tracking: "stack" | "intra" | "inter",
 *     include: "main" | "comp",
 *   },
 * ) => Branch[]}
 */
const test = (code, { tracking, include }) => {
  const trans = compileTrans(include === "comp" ? "emulate" : "builtin");
  /** @type {import("aran").IntrinsicRecord} */
  const intrinsics = evalGlobal(generate(setupile({})));
  intrinsics["aran.transpileEvalCode"] = (/** @type {string} */ code) =>
    trans(
      /** @type {import("./track-basic-aspect.mjs").FilePath} */ (
        "dynamic://eval/local"
      ),
      "eval",
      code,
    );
  intrinsics["aran.retropileEvalCode"] = retro;
  /** @type {Branch[]} */
  const branches = [];
  const weave = compileWeave(tracking);
  setAdvice(
    createAdvice({
      toEvalPath,
      trans,
      retro,
      weave,
      apply: /** @type {(target: any, that: any, input: any[]) => any} */ (
        globalThis.Reflect.apply
      ),
      construct: /** @type {(target: any, input: any[]) => any} */ (
        globalThis.Reflect.construct
      ),
      getValueProperty: /** @type {(obj: any, key: any) => any} */ (
        intrinsics["aran.getValueProperty"]
      ),
      createArray: /** @type {(...values: any[]) => any} */ (
        (values) => values
      ),
      Function: /** @type {any} */ (globalThis.Function),
      // eslint-disable-next-line no-eval
      evalGlobal: /** @type {any} */ (globalThis.eval),
      evalScript: /** @type {any} */ (
        (/** @type {string} */ _code) => {
          throw new Error("evalScript");
        }
      ),
      instrument_dynamic_code: include === "comp",
      SyntaxError: globalThis.SyntaxError,
      String: globalThis.String,
      tracking,
      recordBranch: (kind, prov, tag) => {
        branches.push({ kind, prov, tag });
      },
      record_directory: null,
    }),
  );
  evalGlobal(
    retro(
      weave(
        trans(
          /** @type {import("./track-basic-aspect.mjs").FilePath} */ ("main"),
          "eval",
          code,
        ),
      ),
    ),
  );
  return branches;
};

/**
 * @type {(
 *   config: {
 *     tracking: "stack" | "inter" | "intra",
 *     include: "main" | "comp",
 *   },
 * ) => void}
 */
const testSuite = ({ tracking, include }) => {
  // literal //
  assertDeepEqual(test("(5 ? null : null);", { tracking, include }), [
    {
      kind: "conditional",
      prov: /* 5 */ 1,
      tag: "ConditionalExpression:$.body.0.expression",
    },
  ]);
  // object //
  assertDeepEqual(test("(({}) ? null : null);", { tracking, include }), [
    {
      kind: "conditional",
      prov: 0,
      tag: "ConditionalExpression:$.body.0.expression",
    },
  ]);
  // performBinary //
  assertDeepEqual(test("(2 + 3 ? null : null);", { tracking, include }), [
    {
      kind: "conditional",
      prov:
        /* apply offset (performBinary) */ 1 +
        /** res = 5 */ 0 +
        /* this = undefined */ 1 +
        /* arg0 = "+" */ 1 +
        /* arg1 = 2 */ 1 +
        /* arg2 = 3 */ 1,
      tag: "ConditionalExpression:$.body.0.expression",
    },
  ]);
  // performBinary && performBinary //
  assertDeepEqual(test("(1 + 2 + 3 ? null : null);", { tracking, include }), [
    {
      kind: "conditional",
      prov:
        /* apply offset (performBinary) */ 1 +
        /* res = 6 */ 0 +
        /* this = undefined */ 1 +
        /* arg0 = "+" */ 1 +
        /* arg1 = 1 */ 1 +
        /* arg2 = 5 */ (0 +
          /* apply offset (performBinary) */ 1 +
          /* res = 5 */ 0 +
          /* this = undefined */ 1 +
          /* arg0 = "+" */ 1 +
          /* arg1 = 2 */ 1 +
          /* arg2 = 3 */ 1 +
          0),
      tag: "ConditionalExpression:$.body.0.expression",
    },
  ]);
  // getValueProperty(object) //
  assertDeepEqual(
    test("(({foo: 123}).foo ? null : null);", { tracking, include }),
    [
      {
        kind: "conditional",
        prov:
          /* apply offset (getValueProperty) */ 1 +
          /* res = 123 */ 0 +
          /* this = undefined */ 1 +
          /* arg1 = {foo:123} */ 0 +
          /* arg2 = "foo" */ 1,
        tag: "ConditionalExpression:$.body.0.expression",
      },
    ],
  );
  // getValueProperty(array) //
  assertDeepEqual(test("([123][0] ? null : null);", { tracking, include }), [
    {
      kind: "conditional",
      prov:
        /* apply offset (getValueProperty) */ 1 +
        /* res = 123 */ 0 +
        /* this = undefined */ 1 +
        /* arg1 = [123] */ 0 +
        /* arg2 = 0 */ 1,
      tag: "ConditionalExpression:$.body.0.expression",
    },
  ]);
  // inter-procedural argument tracking //
  assertDeepEqual(
    test("{ const f = (x) => (x ? null : null); f(2 + 3); }", {
      tracking,
      include,
    }),
    [
      {
        kind: "conditional",
        prov:
          /* apply performBinaryOperation */ 1 +
          /* res = true */ 0 +
          /* this = undefined */ 1 +
          /* arg0 = ">=" */ 0 +
          /* arg1 = (length) */ 0 +
          /* arg2 = 1 */ 1 +
          0,
        tag: "Identifier:$.body.0.body.0.declarations.0.init.params.0",
      },
      {
        kind: "conditional",
        prov: {
          stack: 0,
          intra:
            /* apply getValueProperty */ 1 +
            /* res = 5 */ 0 +
            /* this = undefined */ 1 +
            /* arg0 = &input */ 0 +
            /* arg1 = 0 */ 1 +
            0,
          inter:
            /* apply getValueProperty */ 1 +
            /* res = 5 */ 4 +
            /* this = undefined */ 1 +
            /* arg0 = &input */ 0 +
            /* arg1 = 0 */ 1 +
            0,
        }[tracking],
        tag: "ConditionalExpression:$.body.0.body.0.declarations.0.init.body",
      },
    ],
  );
  // inter-procedural result tracking //
  assertDeepEqual(
    test("{ const f = () => 2 + 3; (f() ? null : null); }", {
      tracking,
      include,
    }),
    [
      {
        kind: "conditional",
        prov: { stack: 2, intra: 2, inter: 8 }[tracking],
        tag: "ConditionalExpression:$.body.0.body.1.expression",
      },
    ],
  );
  // inter-procedural result tracking //
  assertDeepEqual(
    test("{ const f = () => 2 + 3; (f() ? null : null); }", {
      tracking,
      include,
    }),
    [
      {
        kind: "conditional",
        prov: { stack: 2, intra: 2, inter: 8 }[tracking],
        tag: "ConditionalExpression:$.body.0.body.1.expression",
      },
    ],
  );
  // dynamic code >> local eval //
  assertDeepEqual(test("eval('(5 ? null : null);');", { tracking, include }), [
    ...(include === "comp"
      ? [
          {
            kind: "conditional",
            prov: /* has declarative record */ 3,
            tag: "CallExpression:$.body.0.expression",
          },
          {
            kind: "conditional",
            prov: /* has global object */ 3,
            tag: "CallExpression:$.body.0.expression",
          },
        ]
      : []),
    {
      kind: "conditional",
      prov: /* eval === intrinsics.eval */ 3,
      tag: "CallExpression:$.body.0.expression",
    },
    {
      kind: "conditional",
      prov: /* typeof arg0 === "string" */ 8,
      tag: "CallExpression:$.body.0.expression",
    },
    {
      kind: "conditional",
      prov: /* 5 */ 1,
      tag: "ConditionalExpression:$.body.0.expression",
    },
  ]);
  // dynamic code >> global eval //
  assertDeepEqual(
    test("this.eval('(5 ? null : null);');", { tracking, include }),
    include === "comp"
      ? [
          {
            kind: "conditional",
            prov: /* 5 */ 1,
            tag: "ConditionalExpression:$.body.0.expression",
          },
        ]
      : [],
  );
  // dynamic code >> Function //
  assertDeepEqual(
    test(
      "((new this.Function('x', 'y', 'return x + y;')(2, 3)) ? null : null);",
      {
        tracking,
        include,
      },
    ),
    include === "main"
      ? [
          {
            kind: "conditional",
            prov: /* 5 */ 4,
            tag: "ConditionalExpression:$.body.0.expression",
          },
        ]
      : [
          {
            kind: "conditional",
            prov: 1,
            tag: "FunctionExpression:$.body.0.expression",
          },
          {
            kind: "conditional",
            prov: 6,
            tag: "FunctionExpression:$.body.0.expression",
          },
          {
            kind: "conditional",
            prov: 4,
            tag: "Identifier:$.body.0.expression.params.0",
          },
          {
            kind: "conditional",
            prov: 4,
            tag: "Identifier:$.body.0.expression.params.1",
          },
          {
            kind: "conditional",
            prov: 1,
            tag: "FunctionExpression:$.body.0.expression",
          },
          {
            kind: "conditional",
            prov: { stack: 5, intra: 5, inter: 16 }[tracking],
            tag: "ConditionalExpression:$.body.0.expression",
          },
        ],
  );
};

testSuite({ tracking: "stack", include: "main" });
testSuite({ tracking: "stack", include: "comp" });
testSuite({ tracking: "intra", include: "main" });
testSuite({ tracking: "intra", include: "comp" });
testSuite({ tracking: "inter", include: "main" });
testSuite({ tracking: "inter", include: "comp" });
