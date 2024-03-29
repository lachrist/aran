import { flatMap } from "array-lite";
import { partial_xx, reduceReverse } from "../../util/index.mjs";
import {
  makeSequenceExpression,
  makeClosureExpression,
  makeBlock,
  makeExpressionEffect,
  makeEffectStatement,
  makeReturnStatement,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { OBJECT_PROPERTY } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMemo,
  compileTest,
} from "./__fixture__.mjs";
import ObjectPrototype from "./object-prototype.mjs";
import ObjectValue from "./object-value.mjs";
import ObjectProperty from "./object-property.mjs";

const visitClosure = (_node, _context, site) =>
  makeClosureExpression(
    site.kind,
    false,
    false,
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(makeExpressionEffect(site.super)),
        makeEffectStatement(makeExpressionEffect(site.name)),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
  );

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  ObjectPrototype,
  ObjectProperty,
  ObjectValue,
  Closure: {
    __ANNOTATE__: (node, _serial) => node,
    FunctionExpression: visitClosure,
    ArrowFunctionExpression: visitClosure,
  },
  ExpressionMemo,
  Expression: {
    ...Expression,
    ObjectExpression: (node, context, _site) =>
      reduceReverse(
        flatMap(
          node.properties,
          partial_xx(visit, context, {
            ...OBJECT_PROPERTY,
            self: makeLiteralExpression("self"),
            super: makeLiteralExpression("super"),
          }),
        ),
        makeSequenceExpression,
        makeLiteralExpression("self"),
      ),
  },
});

test(
  `({[123]:456});`,
  `
    {
      void (
        void intrinsic.Reflect.defineProperty(
          "self",
          123,
          intrinsic.aran.createObject(
            null,
            "value", 456,
            "writable", true,
            "enumerable", true,
            "configurable", true,
          ),
        ),
        "self"
      );
    }
  `,
);

test(
  `({__proto__:null});`,
  `
    {
      void (
        void intrinsic.Reflect.setProtoypeOf(
          "self",
          null,
        ),
        "self"
      );
    }
  `,
);

test(
  `({...123});`,
  `
    {
      void (
        void intrinsic.Object.assign(
          "self",
          123,
        ),
        "self"
      );
    }
  `,
);

test(
  `({ [123]: () => {} });`,
  `
    {
      let key;
      void (
        void intrinsic.Reflect.defineProperty(
          "self",
          (key = 123, key),
          intrinsic.aran.createObject(
            null,
            "value", () => {
              void "super";
              void key;
              return "completion";
            },
            "writable", true,
            "enumerable", true,
            "configurable", true,
          ),
        ),
        "self"
      );
    }
  `,
);

test(
  `({ [123] () {} });`,
  `
    {
      let key;
      void (
        void intrinsic.Reflect.defineProperty(
          "self",
          (key = 123, key),
          intrinsic.aran.createObject(
            null,
            "value", function method () {
              void "super";
              void key;
              return "completion";
            },
            "writable", true,
            "enumerable", true,
            "configurable", true,
          ),
        ),
        "self"
      );
    }
  `,
);

test(
  `({ get [123] () {} });`,
  `
    {
      let key;
      void (
        void intrinsic.Reflect.defineProperty(
          "self",
          (key = 123, key),
          intrinsic.aran.createObject(
            null,
            "get", function () {
              void "super";
              void intrinsic.aran.binary("+", "get ", key);
              return "completion";
            },
            "enumerable", true,
            "configurable", true,
          ),
        ),
        "self"
      );
    }
  `,
);

test(
  `({ set [123] (x) {} });`,
  `
    {
      let key;
      void (
        void intrinsic.Reflect.defineProperty(
          "self",
          (key = 123, key),
          intrinsic.aran.createObject(
            null,
            "set", function () {
              void "super";
              void intrinsic.aran.binary("+", "set ", key);
              return "completion";
            },
            "enumerable", true,
            "configurable", true,
          ),
        ),
        "self"
      );
    }
  `,
);

done();
