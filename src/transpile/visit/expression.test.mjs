import { assert, assertEqual } from "../../__fixture__.mjs";
import { hasOwn } from "../../util/index.mjs";
import {
  makeLiteralExpression,
  makeReturnStatement,
  makeBlock,
  makeParameterExpression,
  makeClosureExpression,
} from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";
import PropertyVisitor from "./property.mjs";
import CalleeVisitor from "./callee.mjs";
import PatternVisitor from "./pattern.mjs";
import AssignmentVisitor from "./assignment.mjs";
import UpdateVisitor from "./update.mjs";
import EffectVisitor from "./effect.mjs";
import ExpressionVisitor from "./expression.mjs";

const visitClass = (node, _context, _site) => {
  assertEqual(node.superClass, null);
  assertEqual(node.body.body.length, 0);
  return makeClosureExpression(
    "constructor",
    false,
    false,
    makeBlock([], [], [makeReturnStatement(makeParameterExpression("this"))]),
  );
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

const Visitor = {
  ...TestVisitor,
  ...QuasiVisitor,
  ...PropertyVisitor,
  ...CalleeVisitor,
  ...PatternVisitor,
  ...AssignmentVisitor,
  ...UpdateVisitor,
  ...EffectVisitor,
  ...ExpressionVisitor,
  Statement: {
    ...TestVisitor.Statement,
    ReturnStatement: (node, context, _site) => [
      makeReturnStatement(
        visit("Expression", node.argument, context, { name: null }),
      ),
    ],
  },
  Class: {
    ClassExpression: visitClass,
  },
  Closure: {
    ArrowFunctionExpression: visitClosure,
    FunctionExpression: visitClosure,
  },
};

const testExpression = (input, output) => {
  test(input, { visitors: Visitor }, { name: null }, output);
};

// Literal //
testExpression(`123;`, `{ void 123; }`);

// Identifier //
testExpression(`x`, `{ void [x]; }`);

// ThisExpression //
testExpression(`this;`, `{ void "this"; }`);

// MetaProperty //
testExpression(`new.target;`, `{ void "new.target"; }`);
testExpression(`import.meta;`, `{ void "import.meta"; }`);

// ArrowFunctionExpression //
testExpression(`(() => {});`, `{ void (() => { return undefined; }); }`);

// FunctionExpression //
testExpression(
  `(function () {});`,
  `{ void (function () { return undefined; }); }`,
);

// ClassExpression //
testExpression(
  `(class {});`,
  `{ void (function constructor () { return this; }); }`,
);

// TemplateLiteral //
testExpression("`foo`;", `{ void "foo"; }`);
testExpression(
  "`foo${123}bar${456}qux`;",
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
);

// TaggedTemplateExpression //
testExpression(
  "123`foo${456}\\n${789}qux`;",
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
);

// AwaitExpression //
testExpression(`await 123;`, `{ void await 123; }`);

// YieldExpression //
testExpression(`yield* 123;`, `{ void (yield* 123); }`);
testExpression(`yield;`, `{ void (yield undefined); }`);

// AssignmentExpression //
testExpression(
  `"use strict"; return x = 123;`,
  `
    {
      let right;
      return (
        right = 123,
        ([x] = right, right)
      );
    }
  `,
);

// UpdateExpression //
testExpression(
  `"use strict"; return ++x;`,
  `
    {
      let right;
      return (
        right = intrinsic.aran.binary("+", [x], 1),
        ([x] = right, right)
      );
    }
  `,
);

// SequenceExpression //
testExpression(
  `"use strict"; return (x = 123, 456);`,
  `{ return ([x] = 123, 456); }`,
);
