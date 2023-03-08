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
  ExpressionMacro,
  compileTest,
} from "./__fixture__.mjs";
import ObjectPropertyValue from "./object-property-value.mjs";
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
        makeEffectStatement(makeExpressionEffect(site.self)),
        makeEffectStatement(makeExpressionEffect(site.name)),
        makeReturnStatement(makeLiteralExpression("completion")),
      ],
    ),
  );

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  ObjectProperty,
  ObjectPropertyValue,
  Closure: {
    __ANNOTATE__: (node, _serial) => node,
    FunctionExpression: visitClosure,
    ArrowFunctionExpression: visitClosure,
  },
  ExpressionMacro,
  Expression: {
    ...Expression,
    ObjectExpression: (node, context, _site) =>
      reduceReverse(
        flatMap(
          node.properties,
          partial_xx(visit, context, {
            ...OBJECT_PROPERTY,
            self: makeLiteralExpression("self"),
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
  `({__proto__:123});`,
  `
    {
      void (
        void intrinsic.Reflect.setProtoypeOf(
          "self",
          123,
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
              void "self";
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
              void "self";
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
              void "self";
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
              void "self";
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
