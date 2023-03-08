import { UPDATE_EXPRESSION } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMacro,
  compileTest,
} from "./__fixture__.mjs";
import UpdateExpression from "./update-expression.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  UpdateExpression,
  ExpressionMacro,
  Expression: {
    ...Expression,
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        ...UPDATE_EXPRESSION,
        prefix: node.prefix,
        operator: node.operator,
      }),
  },
});

test(
  `"use strict"; ++x;`,
  `
    {
      let right_new;
      void (
        right_new = intrinsic.aran.binary("+", [x], 1),
        (
          [x] = right_new,
          right_new
        )
      );
    }
  `,
);

test(
  `"use strict"; x++;`,
  `
    {
      let right_old;
      void (
        right_old = [x],
        (
          [x] = intrinsic.aran.binary("+", right_old, 1),
          right_old
        )
      );
    }
  `,
);

test(
  `++(123)[456];`,
  `
    {
      let object, key;
      void (
        object = 123,
        (
          key = 456,
          intrinsic.aran.setSloppy(
            object,
            key,
            intrinsic.aran.binary(
              "+",
              intrinsic.aran.get(object, key),
              1,
            ),
          )
        )
      );
    }
  `,
);

test(
  `(123)[456]++;`,
  `
    {
      let object, key, right_old;
      void (
        object = 123,
        (
          key = 456,
          (
            right_old = intrinsic.aran.get(object, key),
            (
              void intrinsic.aran.setSloppy(
                object,
                key,
                intrinsic.aran.binary("+", right_old, 1),
              ),
              right_old
            )
          )
        )
      );
    }
  `,
);

done();
