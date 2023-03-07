import { visit, ASSIGNMENT_EFFECT } from "./context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import PatternElement from "./pattern-element.mjs";
import Pattern from "./pattern.mjs";
import AssignmentEffect from "./assignment-effect.mjs";

const { test, done } = compileTest({
  Program,
  Expression,
  PatternElement,
  Pattern,
  AssignmentEffect,
  Statement,
  Effect: {
    ...Effect,
    AssignmentExpression: (node, context, _site) =>
      visit(node.left, context, {
        ...ASSIGNMENT_EFFECT,
        operator: node.operator,
        right: node.right,
      }),
  },
});

test(`"use strict"; x = 123;`, `{ [x] = 123; }`);

test(
  `"use strict"; x **= 123;`,
  `{ [x] = intrinsic.aran.binary("**", [x], 123); }`,
);

test(`(123)[456] = 789;`, `{ void intrinsic.aran.setSloppy(123, 456, 789); }`);

test(
  `(123)[456] **= 789;`,
  `
    {
      let object, property;
      object = 123;
      property = 456;
      void intrinsic.aran.setSloppy(
        object,
        property,
        intrinsic.aran.binary(
          "**",
          intrinsic.aran.get(object, property),
          789,
        ),
      );
    }
  `,
);

test(
  `"use strict"; [x] = 123;`,
  `
    {
      let right, iterator;
      right = 123;
      iterator = intrinsic.aran.get(right, intrinsic.Symbol.iterator)(!right);
      [x] = intrinsic.aran.get(iterator, "next")(!iterator);
    }
  `,
);

done();
