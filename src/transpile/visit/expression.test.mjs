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
import { makeScopeTestBlock } from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";
import { testBlock } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";
import PropertyVisitor from "./property.mjs";
import CalleeVisitor from "./callee.mjs";
import PatternVisitor from "./pattern.mjs";
import ExpressionVisitor from "./expression.mjs";

const DEFAULT_SITE = {
  strict: false,
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
  Block: {
    BlockStatement: (node, context1, site) =>
      makeScopeTestBlock({ ...context1, strict: site.strict }, (context2) =>
        flatMap(node.body, partialx_xx(visitMany, "Statement", context2, site)),
      ),
  },
  Statement: {
    ExpressionStatement: (node, context, site) => [
      makeEffectStatement(
        makeExpressionEffect(
          visit("Expression", node.expression, context, site),
        ),
      ),
    ],
  },
  Class: {
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
  Closure: {
    ArrowFunctionExpression: visitClosure,
    FunctionExpression: visitClosure,
  },
  ...QuasiVisitor,
  ...CalleeVisitor,
  ...PropertyVisitor,
  ...PatternVisitor,
  ...ExpressionVisitor,
};

const test = (input, output, site) => {
  testBlock(
    "Block",
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

// Literal //
test(`{ 123; }`, `{ void 123; }`, {});

// Identifier //
test(`{ x }`, `{ void [x]; }`, {});

// ThisExpression //
test(`{ this; }`, `{ void "this"; }`, {});

// MetaProperty //
test(`{ new.target; }`, `{ void "new.target"; }`, {});
test(`{ import.meta; }`, `{ void "import.meta"; }`, {});

// ArrowFunctionExpression //
test(`{ (() => {}); }`, `{ void (() => { return undefined; }); }`, {});

// FunctionExpression //
test(
  `{ (function () {}); }`,
  `{ void (function () { return undefined; }); }`,
  {},
);

// ClassExpression //
test(
  `{ (class {}); }`,
  `{ void (function constructor () { return this; }); }`,
  {},
);

// TemplateLiteral //
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

// TaggedTemplateExpression //
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

// AwaitExpression //
test(`{ await 123; }`, `{ void await 123; }`, {});

// YieldExpression //
test(`{ yield* 123; }`, `{ void (yield* 123); }`, {});
test(`{ yield; }`, `{ void (yield undefined); }`, {});

// AssignmentExpression //
test(
  `{ x = 123; }`,
  `
    {
      let right;
      void (
        right = 123,
        ([x] = right, right)
      );
    }
  `,
  { strict: true },
);
test(
  `{ x **= 123; }`,
  `
    {
      let right;
      void (
        right = intrinsic.aran.binary("**", [x], 123),
        ([x] = right, right)
      );
    }
  `,
  { strict: true },
);
test(
  `{ (123)[456] = 789; }`,
  `{ void intrinsic.aran.setSloppy(123, 456, 789); }`,
  {},
);
test(
  `{ (123)[456] **= 789; }`,
  `
    {
      let object, property;
      void intrinsic.aran.setSloppy(
        (object = 123, object),
        (property = 456, property),
        intrinsic.aran.binary(
          "**",
          intrinsic.aran.get(object, property),
          789,
        ),
      );
    }
  `,
  {},
);
test(
  `{ [x] = 123; }`,
  `
    {
      let right1, right2, iterator;
      void (
        right1 = 123,
        (
          right2 = right1,
          (
            iterator = intrinsic.aran.get(right2, intrinsic.Symbol.iterator)(!right2),
            (
              [x] = intrinsic.aran.get(iterator, "next")(!iterator),
              right1
            )
          )
        )
      );
    }
  `,
  { strict: true },
);
