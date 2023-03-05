import { assertNotEqual } from "../../__fixture__.mjs";
import { makeReturnStatement } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import UpdateEffectVisitor from "./update-effect.mjs";

const Visitor = {
  ...TestVisitor,
  Key: KeyVisitor,
  UpdateEffect: UpdateEffectVisitor,
  Statement: {
    ...TestVisitor.Statement,
    ReturnStatement: (node, context, _site) => {
      assertNotEqual(node.argument, null);
      return [
        makeReturnStatement(
          visit(node.argument, context, { type: "Expression", name: "" }),
        ),
      ];
    },
  },
  Effect: {
    ...TestVisitor.Effect,
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        type: "UpdateEffect",
        prefix: node.prefix,
        operator: node.operator,
      }),
  },
};

const testUpdateEffect = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testUpdateEffect(
  `"use strict"; x++;`,
  `{ [x] = intrinsic.aran.binary("+", [x], 1); }`,
);

testUpdateEffect(
  `(123)[456]++;`,
  `{
      let object, property;
      object = 123;
      property = 456;
      void intrinsic.aran.setSloppy(
        object,
        property,
        intrinsic.aran.binary(
          "+",
          intrinsic.aran.get(object, property),
          1,
        ),
      );
    }
  `,
);
