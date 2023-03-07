import { visit } from "./context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import PatternElement from "./pattern-element.mjs";
import Pattern from "./pattern.mjs";
import AssignmentExpression from "./assignment-expression.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Pattern,
  PatternElement,
  AssignmentExpression,
  Expression: {
    ...Expression,
    AssignmentExpression: (node, context, _site) =>
      visit(node.left, context, {
        type: "AssignmentExpression",
        operator: node.operator,
        right: node.right,
      }),
  },
});

test(
  `"use strict"; x = 123;`,
  `
    {
      let right;
      void (
        right = 123,
        (
          [x] = right,
          right
        )
      );
    }
  `,
);

test(
  `"use strict"; x **= 123;`,
  `
    {
      let right;
      void (
        right = intrinsic.aran.binary("**", [x], 123),
        (
          [x] = right,
          right
        )
      );
    }
  `,
);

test(`(123)[456] = 789;`, `{ void intrinsic.aran.setSloppy(123, 456, 789); }`);

test(
  `(123)[456] **= 789;`,
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
              "**",
              intrinsic.aran.get(object, property),
              789,
            )
          )
        )
      );
    }
  `,
);

test(
  `"use strict"; [x] = 123;`,
  `
    {
      let right, right_pattern, iterator;
      void (
        right = 123,
        (
          right_pattern = right,
          (
            iterator = intrinsic.aran.get(
              right_pattern,
              intrinsic.Symbol.iterator
            )(!right_pattern),
            (
              [x] = intrinsic.aran.get(iterator, "next")(!iterator),
              right
            )
          )
        )
      );
    }
  `,
);

done();
