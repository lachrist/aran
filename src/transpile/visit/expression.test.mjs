import { flatMap } from "array-lite";
import { assert, assertEqual } from "../../__fixture__.mjs";
import { hasOwn, partialx_xx } from "../../util/index.mjs";
import {
  makeLiteralExpression,
  makeReturnStatement,
  makeBlock,
  makeParameterExpression,
  makeClosureExpression,
  makeExpressionEffect,
  makeEffectStatement,
} from "../../ast/index.mjs";
import {
  makeScopeTestBlock,
  makeScopeBaseWriteEffect,
} from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";
import { testBlock } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";
import PropertyVisitor from "./property.mjs";
import CalleeVisitor from "./callee.mjs";
import ExpressionVisitor from "./expression.mjs";

const DEFAULT_SITE = {
  dropped: false,
  name: null,
};

const visitClosure = (node, _context, site) => {
  assertEqual(node.params.length, 0);
  assertEqual(node.body.type, "BlockStatement");
  assertEqual(node.body.body.length, 0);
  assert(hasOwn(site, "kind"));
  return makeClosureExpression(
    site.kind,
    node.async,
    node.generator,
    makeBlock(
      [],
      [],
      [makeReturnStatement(makeLiteralExpression({ undefined: null }))],
    ),
  );
};

const visitors = {
  block: {
    BlockStatement: (node, context1, site) =>
      makeScopeTestBlock(context1, (context2) =>
        flatMap(node.body, partialx_xx(visitMany, "statement", context2, site)),
      ),
  },
  statement: {
    ExpressionStatement: (node, context, site) => [
      makeEffectStatement(
        makeExpressionEffect(
          visit("expression", node.expression, context, site),
        ),
      ),
    ],
  },
  class: {
    ClassExpression: (node, _context, _site) => {
      assertEqual(node.superClass, null);
      assertEqual(node.body.body.length, 0);
      return makeClosureExpression(
        "constructor",
        false,
        false,
        makeBlock(
          [],
          [],
          [makeReturnStatement(makeParameterExpression("this"))],
        ),
      );
    },
  },
  closure: {
    ArrowFunctionExpression: visitClosure,
    FunctionExpression: visitClosure,
  },
  pattern: {
    Identifier: (node, context, site) => {
      assert(hasOwn(site, "right"), "missing right in pattern site");
      assert(hasOwn(site, "kind"), "missing kind in pattern site");
      assertEqual(site.kind, null, "unexpected kind in pattern site");
      return makeScopeBaseWriteEffect(context, node.name, site.right);
    },
  },
  expression: ExpressionVisitor,
  quasi: QuasiVisitor,
  callee: CalleeVisitor,
  property: PropertyVisitor,
};

const test = (input, output, site) => {
  testBlock(
    "block",
    input,
    "body/0",
    { visitors },
    {
      ...DEFAULT_SITE,
      ...site,
    },
    output,
  );
};

test(`{ 123; }`, `{ void 123; }`, {});

test(`{ x }`, `{ void [x]; }`, {});

test(`{ this; }`, `{ void "this"; }`, {});

test(`{ new.target; }`, `{ void "new.target"; }`, {});

test(`{ import.meta; }`, `{ void "import.meta"; }`, {});

test(`{ (() => {}); }`, `{ void (() => { return undefined; }); }`, {});

test(
  `{ (function () {}); }`,
  `{ void (function () { return undefined; }); }`,
  {},
);

test(
  `{ (class {}); }`,
  `{ void (function constructor () { return this; }); }`,
  {},
);

test("{ `foo`; }", `{ void "foo"; }`, {});

test(
  "{ `foo${123}bar${456}qux`; }",
  `
    {
      void intrinsic.aran.binary(
        "+",
        intrinsic.aran.binary(
          "+",
          intrinsic.aran.binary("+", "foo", 123),
          intrinsic.aran.binary("+", "bar", 456),
        ),
        "qux",
      );
    }
  `,
  {},
);

test(
  "{ 123`foo${456}\\n${789}qux`; }",
  `
    {
      void (123)(
        intrinsic.Object.freeze(
          intrinsic.Object.defineProperty(
            intrinsic.Array.of("foo", "\\n", "qux"),
            "raw",
            intrinsic.aran.createObject(
              null,
              "value", intrinsic.Object.freeze(
                intrinsic.Array.of("foo", "\\\\n", "qux"),
              ),
              "writable", false,
              "enumerable", false,
              "configurable", false,
            ),
          ),
        ),
        456,
        789,
      );
    }
  `,
  {},
);

test(`{ await 123; }`, `{ void await 123; }`, {});

test(`{ yield* 123; }`, `{ void (yield* 123); }`, {});

test(`{ yield; }`, `{ void (yield undefined); }`, {});
