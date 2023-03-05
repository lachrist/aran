import { assertNotEqual } from "../../__fixture__.mjs";
import { makeReturnStatement } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import PatternElementVisitor from "./pattern-element.mjs";
import PatternPropertyVisitor from "./pattern-property.mjs";
import PatternVisitor from "./pattern.mjs";
import AssignmentEffectVisitor from "./assignment-effect.mjs";

const Visitor = {
  ...TestVisitor,
  Key: KeyVisitor,
  PatternElement: PatternElementVisitor,
  PatternProperty: PatternPropertyVisitor,
  Pattern: PatternVisitor,
  AssignmentEffect: AssignmentEffectVisitor,
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
    AssignmentExpression: (node, context, _site) =>
      visit(node.left, context, {
        type: "AssignmentEffect",
        operator: node.operator,
        right: node.right,
      }),
  },
};

const testAssignmentEffect = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testAssignmentEffect(`"use strict"; x = 123;`, `{ [x] = 123; }`);

testAssignmentEffect(
  `"use strict"; x **= 123;`,
  `{ [x] = intrinsic.aran.binary("**", [x], 123); }`,
);

testAssignmentEffect(
  `(123)[456] = 789;`,
  `{ void intrinsic.aran.setSloppy(123, 456, 789); }`,
);

testAssignmentEffect(
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

testAssignmentEffect(
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
