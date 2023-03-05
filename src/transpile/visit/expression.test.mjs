import { assert, assertEqual } from "../../__fixture__.mjs";
import { hasOwn } from "../../util/index.mjs";
import {
  annotateNode,
  makeLiteralExpression,
  makeReturnStatement,
  makeBlock,
  makeParameterExpression,
  makeClosureExpression,
} from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";
import KeyVisitor from "./key.mjs";
import CalleeVisitor from "./callee.mjs";
import AssignmentExpressionVisitor from "./assignment-expression.mjs";
import UpdateExpressionVisitor from "./update-expression.mjs";
import DeleteVisitor from "./delete.mjs";
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
  Quasi: QuasiVisitor,
  Key: KeyVisitor,
  Callee: CalleeVisitor,
  AssignmentExpression: AssignmentExpressionVisitor,
  UpdateExpression: UpdateExpressionVisitor,
  Delete: DeleteVisitor,
  Expression: ExpressionVisitor,
  Statement: {
    ...TestVisitor.Statement,
    ReturnStatement: (node, context, _site) => [
      makeReturnStatement(
        visit(node.argument, context, { type: "Expression", name: "" }),
      ),
    ],
  },
  Class: {
    __ANNOTATE__: annotateNode,
    ClassExpression: visitClass,
  },
  Closure: {
    __ANNOTATE__: annotateNode,
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

// MetaKey //
testExpression(`new.target;`, `{ void "new.target"; }`);
testExpression(`import.meta;`, `{ void "import.meta"; }`);

// ArrowFunctionExpression //
testExpression(`(() => {});`, `{ void (() => { return undefined; }); }`);

// FunctionExpression //
testExpression(
  `(function () {});`,
  `{ void (function () { return undefined; }); }`,
);
testExpression(
  `(function f () {});`,
  `{ void (function () { return undefined; }); }`,
);

// ClassExpression //
testExpression(
  `(class {});`,
  `{ void (function constructor () { return this; }); }`,
);
testExpression(
  `(class C {});`,
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
  `"use strict"; return (123, 456);`,
  `{ return (void 123, 456); }`,
);

// ConditionalExpression //
testExpression(`return 123 ? 456 : 789;`, `{ return 123 ? 456 : 789; } `);

// LogicalExpression //
testExpression(
  `return 123 && 456;`,
  `
    {
      let left;
      return (
        left = 123,
        (left ? 456 : left)
      );
    }
  `,
);
testExpression(
  `return 123 || 456;`,
  `
    {
      let left;
      return (
        left = 123,
        (left ? left : 456)
      );
    }
  `,
);
testExpression(
  `return 123 ?? 456;`,
  `
    {
      let left;
      return (
        left = 123,
        (
          (
            intrinsic.aran.binary("===", left, null) ?
            true :
            intrinsic.aran.binary("===", left, undefined)
          ) ?
          456 :
          left
        )
      );
    }
  `,
);

// ImportExpression //
testExpression(`import("source");`, `{ void ("import")("source"); }`);

// UnaryExpression //
testExpression(`void 123;`, `{ void (void 123, undefined); }`);
testExpression(`!123;`, `{ void intrinsic.aran.unary("!", 123); }`);
testExpression(`delete 123;`, `{ void (void 123, true); }`);

// BinaryExpression //
testExpression(`123 + 456;`, `{ void intrinsic.aran.binary("+", 123, 456); }`);

// MemberExpression //
testExpression(`(123)[456];`, `{ void intrinsic.aran.get(123, 456); }`);
testExpression(
  `(123)?.[456];`,
  `
    {
      let object;
      void (
        object = 123,
        (
          (
            intrinsic.aran.binary("===", object, null) ?
            true :
            intrinsic.aran.binary("===", object, undefined)
          ) ?
          undefined :
          intrinsic.aran.get(object, 456)
        )
      );
    }
  `,
);
