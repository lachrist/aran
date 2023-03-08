import { UPDATE_EFFECT } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMacro,
  compileTest,
} from "./__fixture__.mjs";
import UpdateEffect from "./update-effect.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Expression,
  ExpressionMacro,
  UpdateEffect,
  Effect: {
    ...Effect,
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        ...UPDATE_EFFECT,
        prefix: node.prefix,
        operator: node.operator,
      }),
  },
});

test(`"use strict"; x++;`, `{ [x] = intrinsic.aran.binary("+", [x], 1); }`);

test(
  `(123)[456]++;`,
  `
    {
      let object, key;
      object = 123;
      key = 456;
      void intrinsic.aran.setSloppy(
        object,
        key,
        intrinsic.aran.binary(
          "+",
          intrinsic.aran.get(object, key),
          1,
        ),
      );
    }
  `,
);

done();
