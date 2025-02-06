import { deepStrictEqual as assertDeepEqual } from "node:assert";
import { parse } from "acorn";
import { generate } from "astring";
import { setupile, transpile, retropile } from "aran";
import { advice_global_variable, weave, createAdvice } from "./aspect.mjs";

const { Reflect, eval: evalGlobal } = globalThis;

const intrinsics = evalGlobal(generate(setupile({})));

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
 *   code: string,
 *   procedural: "inter" | "intra",
 * ) => Branch[]}
 */
const test = (code, procedural) => {
  /** @type {Branch[]} */
  const branches = [];
  setAdvice(
    createAdvice(
      {
        apply: /** @type {any} */ (Reflect.apply),
        construct: /** @type {any} */ (Reflect.construct),
        getValueProperty: intrinsics["aran.getValueProperty"],
      },
      {
        procedural,
        recordBranch: (kind, size, /** @type {string} */ tag) => {
          branches.push({ kind, size, tag });
        },
      },
    ),
  );
  evalGlobal(
    generate(
      retropile(
        weave(
          transpile(
            {
              kind: "eval",
              path: "main",
              root: parse(code, {
                sourceType: "script",
                ecmaVersion: "latest",
              }),
            },
            { digest, global_declarative_record: "builtin" },
          ),
        ),
        {
          mode: "normal",
        },
      ),
    ),
  );
  return branches;
};

/** @type {["intra", "inter"]} */
const procedurals = ["intra", "inter"];

for (const procedural of procedurals) {
  // literal //
  assertDeepEqual(test("(5 ? null : null);", procedural), [
    { kind: "conditional", size: /* 5 */ 1, tag: "$.body.0.expression" },
  ]);
  // performBinary //
  assertDeepEqual(test("(2 + 3 ? null : null);", procedural), [
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
  assertDeepEqual(test("(1 + 2 + 3 ? null : null);", procedural), [
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
  assertDeepEqual(test("(({foo: 123}).foo ? null : null);", procedural), [
    {
      kind: "conditional",
      size:
        /* apply offset (getValueProperty) */ 1 +
        /* this = undefined */ 1 +
        /* arg1 = {foo:123} */ 0 +
        /* arg2 = "foo" */ 1,
      tag: "$.body.0.expression",
    },
  ]);
  // getValueProperty(array) //
  assertDeepEqual(test("([123][0] ? null : null);", procedural), [
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
    test("{ const f = (x) => (x ? null : null); f(2 + 3); }", procedural),
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
    test("{ const f = () => 2 + 3; (f() ? null : null); }", procedural),
    [
      {
        kind: "conditional",
        size: 2 + (procedural === "inter" ? 5 : 0),
        tag: "$.body.0.body.1.expression",
      },
    ],
  );
}
