import { visit } from "./context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import UpdateEffect from "./update-effect.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Expression,
  UpdateEffect,
  Effect: {
    ...Effect,
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        type: "UpdateEffect",
        prefix: node.prefix,
        operator: node.operator,
      }),
  },
});

test(`"use strict"; x++;`, `{ [x] = intrinsic.aran.binary("+", [x], 1); }`);

test(
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

done();
