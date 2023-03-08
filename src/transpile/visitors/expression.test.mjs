import { assert, assertEqual } from "../../__fixture__.mjs";
import { hasOwn } from "../../util/index.mjs";
import {
  makeLiteralExpression,
  makeReturnStatement,
  makeBlock,
  makeParameterExpression,
  makeClosureExpression,
} from "../../ast/index.mjs";
import { makeArrayExpression } from "../../intrinsic.mjs";
import { annotate } from "../annotate.mjs";
import { EXPRESSION } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";
import Quasi from "./quasi.mjs";
import QuasiRaw from "./quasi-raw.mjs";
import Callee from "./callee.mjs";
import AssignmentExpression from "./assignment-expression.mjs";
import UpdateExpression from "./update-expression.mjs";
import Delete from "./delete.mjs";
import ObjectPrototype from "./object-prototype.mjs";
import ObjectPropertyPrototype from "./object-property-prototype.mjs";
import ObjectValue from "./object-value.mjs";
import ObjectProperty from "./object-property.mjs";
import ObjectPropertyRegular from "./object-property-regular.mjs";
import Expression from "./expression.mjs";

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

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Quasi,
  QuasiRaw,
  Callee,
  AssignmentExpression,
  UpdateExpression,
  Delete,
  Expression,
  ExpressionMemo,
  ObjectPrototype,
  ObjectPropertyPrototype,
  ObjectValue,
  ObjectProperty,
  ObjectPropertyRegular,
  // This is not 100% correct.
  // The actual is normalized code is too verbose.
  Spread: {
    __ANNOTATE__: annotate,
    SpreadElement: (node, context, _site) =>
      visit(node.argument, context, EXPRESSION),
    __DEFAULT__: (node, context, _site) =>
      makeArrayExpression([visit(node, context, EXPRESSION)]),
  },
  Class: {
    __ANNOTATE__: annotate,
    ClassExpression: visitClass,
  },
  Closure: {
    __ANNOTATE__: annotate,
    ArrowFunctionExpression: visitClosure,
    FunctionExpression: visitClosure,
  },
});

// Literal //
test(`123;`, `{ void 123; }`);

// Identifier //
test(`x`, `{ void [x]; }`);

// ThisExpression //
test(`this;`, `{ void "this"; }`);

// MetaKey //
test(`new.target;`, `{ void "new.target"; }`);
test(`import.meta;`, `{ void "import.meta"; }`);

// ArrowFunctionExpression //
test(`(() => {});`, `{ void (() => { return undefined; }); }`);

// FunctionExpression //
test(`(function () {});`, `{ void (function () { return undefined; }); }`);
test(`(function f () {});`, `{ void (function () { return undefined; }); }`);

// ClassExpression //
test(`(class {});`, `{ void (function constructor () { return this; }); }`);
test(`(class C {});`, `{ void (function constructor () { return this; }); }`);

// TemplateLiteral //
test("`foo`;", `{ void "foo"; }`);
test(
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
test(
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
test(`await 123;`, `{ void await 123; }`);

// YieldExpression //
test(`yield* 123;`, `{ void (yield* 123); }`);
test(`yield;`, `{ void (yield undefined); }`);

// AssignmentExpression //
test(
  `"use strict"; x = 123;`,
  `
    {
      let right;
      void (
        right = 123,
        ([x] = right, right)
      );
    }
  `,
);

// UpdateExpression //
test(
  `"use strict"; ++x;`,
  `
    {
      let right;
      void (
        right = intrinsic.aran.binary("+", [x], 1),
        ([x] = right, right)
      );
    }
  `,
);

// SequenceExpression //
test(`"use strict"; (123, 456);`, `{ void (void 123, 456); }`);

// ConditionalExpression //
test(`123 ? 456 : 789;`, `{ void (123 ? 456 : 789); } `);

// LogicalExpression //
test(
  `123 && 456;`,
  `
    {
      let left;
      void (
        left = 123,
        (left ? 456 : left)
      );
    }
  `,
);
test(
  `123 || 456;`,
  `
    {
      let left;
      void (
        left = 123,
        (left ? left : 456)
      );
    }
  `,
);
test(
  `123 ?? 456;`,
  `
    {
      let left;
      void (
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
test(`import("source");`, `{ void ("import")("source"); }`);

// UnaryExpression //
test(`void 123;`, `{ void (void 123, undefined); }`);
test(`!123;`, `{ void intrinsic.aran.unary("!", 123); }`);
test(`delete 123;`, `{ void (void 123, true); }`);

// BinaryExpression //
test(`123 + 456;`, `{ void intrinsic.aran.binary("+", 123, 456); }`);

// MemberExpression //
test(`(123)[456];`, `{ void intrinsic.aran.get(123, 456); }`);
test(
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

// ObjectExpression //
test(`({__proto__:null});`, `{ void intrinsic.aran.createObject(null); }`);
test(
  `({[123]:456});`,
  `
    {
      void intrinsic.aran.createObject(
        intrinsic.Object.prototype,
        123, 456,
      );
    }
  `,
);
test(
  `({[123] () {} });`,
  `
    {
      let _prototype, _super, _key;
      void (
        _prototype = intrinsic.Object.prototype,
        (
          _super = intrinsic.aran.createObject(_prototype),
          intrinsic.aran.createObject(
            _prototype,
            (_key = 123, _key),
            function method () { return undefined; },
          )
        )
      );
    }
  `,
);
test(
  `({...123});`,
  `
    {
      let _self;
      void (
        _self = intrinsic.aran.createObject(intrinsic.Object.prototype),
        (
          void intrinsic.Object.assign(_self, 123),
          _self
        )
      );
    }
  `,
);
test(
  `({ get [123] () {} });`,
  `
    {
      let _prototype, _super, _self, _key;
      void (
        _prototype = intrinsic.Object.prototype,
        (
          _super = intrinsic.aran.createObject(_prototype),
          (
            _self = intrinsic.aran.createObject(_prototype),
            (
              void intrinsic.Reflect.defineProperty(
                _self,
                (_key = 123, _key),
                intrinsic.aran.createObject(
                  null,
                  "get",
                  function () {
                    return undefined;
                  },
                  "enumerable",
                  true,
                  "configurable",
                  true,
                ),
              ),
              _self
            )
          )
        )
      );
    }
  `,
);

// ArrayExpression //
test(`[123, 456, 789];`, `{ void intrinsic.Array.of(123, 456, 789); }`);
test(
  `[123,,...789];`,
  `
    {
      void intrinsic.Array.prototype.flat(
        !intrinsic.Array.of(
          intrinsic.Array.of(123),
          intrinsic.aran.createObject(null, "length", 1),
          789,
        ),
      );
    }
  `,
);

// ApplyExpression >> Regular //
test(`(123)(456, 789);`, `{ void (123)(456, 789); }`);
test(
  `(123)?.(456, 789);`,
  `
    {
      let _callee;
      void (
        _callee = 123,
        (
          intrinsic.aran.binary("===", _callee, null) ?
          true :
          intrinsic.aran.binary("===", _callee, undefined)
        ) ?
        undefined :
        _callee(456, 789)
      );
    }
  `,
);

// ApplyExpression >> Spread //
test(
  `(123)(456, ...789);`,
  `
    {
      void intrinsic.Reflect.apply(
        123,
        undefined,
        intrinsic.Array.prototype.flat(
          !intrinsic.Array.of(
            intrinsic.Array.of(456),
            789,
          ),
        ),
      );
    }
  `,
);
test(
  `(123)?.(456, ...789);`,
  `
    {
      let _callee;
      void (
        _callee = 123,
        (
          (
            intrinsic.aran.binary("===", _callee, null) ?
            true :
            intrinsic.aran.binary("===", _callee, undefined)
          ) ?
          undefined :
          intrinsic.Reflect.apply(
            _callee,
            undefined,
            intrinsic.Array.prototype.flat(
              !intrinsic.Array.of(
                intrinsic.Array.of(456),
                789,
              ),
            ),
          )
        )
      );
    }
  `,
);

// ApplyExpression >> Eval //
test(
  `eval(123, 456);`,
  `
    {
      let _callee, _argument0, _argument1;
      void (
        _callee = [eval],
        (
          _argument0 = 123,
          (
            _argument1 = 456,
            (
              intrinsic.aran.binary("===", _callee, intrinsic.eval) ?
              eval(_argument0) :
              _callee(_argument0, _argument1)
            )
          )
        )
      );
    }
  `,
);
test(
  `eval(123, ...456);`,
  `
    {
      let _callee, _arguments;
      void (
        _callee = [eval],
        (
          _arguments = intrinsic.Array.prototype.flat(
            !intrinsic.Array.of(
              intrinsic.Array.of(123),
              456,
            ),
          ),
          (
            intrinsic.aran.binary("===", _callee, intrinsic.eval) ?
            eval(
              intrinsic.aran.get(_arguments, 0),
            ) :
            intrinsic.Reflect.apply(_callee, undefined, _arguments)
          )
        )
      );
    }
  `,
);

done();
