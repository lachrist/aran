import { visit } from "./context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import UpdateExpression from "./update-expression.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  UpdateExpression,
  Expression: {
    ...Expression,
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        type: "UpdateExpression",
        prefix: node.prefix,
        operator: node.operator,
      }),
  },
});

test(
  `"use strict"; ++x;`,
  `
    {
      let result;
      void (
        result = intrinsic.aran.binary("+", [x], 1),
        (
          [x] = result,
          result
        )
      );
    }
  `,
);

test(
  `"use strict"; x++;`,
  `
    {
      let result;
      void (
        result = [x],
        (
          [x] = intrinsic.aran.binary("+", result, 1),
          result
        )
      );
    }
  `,
);

test(
  `++(123)[456];`,
  `
    {
      let object, property;
      void (
        object = 123,
        (
          property = 456,
          intrinsic.aran.setSloppy(
            object,
            property,
            intrinsic.aran.binary(
              "+",
              intrinsic.aran.get(object, property),
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
      let object, property, value;
      void (
        object = 123,
        (
          property = 456,
          (
            value = intrinsic.aran.get(object, property),
            (
              void intrinsic.aran.setSloppy(
                object,
                property,
                intrinsic.aran.binary("+", value, 1),
              ),
              value
            )
          )
        )
      );
    }
  `,
);

done();
