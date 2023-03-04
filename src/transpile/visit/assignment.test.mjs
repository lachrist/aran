import { assertNotEqual } from "../../__fixture__.mjs";
import { makeReturnStatement } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import PatternVisitor from "./pattern.mjs";
import AssignmentVisitor from "./assignment.mjs";

const Visitor = {
  ...TestVisitor,
  ...KeyVisitor,
  ...PatternVisitor,
  ...AssignmentVisitor,
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
  Expression: {
    ...TestVisitor.Expression,
    AssignmentExpression: (node, context, _site) =>
      visit(node.left, context, {
        type: "AssignmentExpression",
        operator: node.operator,
        right: node.right,
      }),
  },
};

const testAssignment = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

//////////////////////
// AssignmentEffect //
//////////////////////

testAssignment(`"use strict"; x = 123;`, `{ [x] = 123; }`);

testAssignment(
  `"use strict"; x **= 123;`,
  `{ [x] = intrinsic.aran.binary("**", [x], 123); }`,
);

testAssignment(
  `(123)[456] = 789;`,
  `{ void intrinsic.aran.setSloppy(123, 456, 789); }`,
);

testAssignment(
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

testAssignment(
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

//////////////////////////
// AssignmentExpression //
//////////////////////////

testAssignment(
  `"use strict"; return x = 123;`,
  `
    {
      let right;
      return (
        right = 123,
        (
          [x] = right,
          right
        )
      );
    }
  `,
);

testAssignment(
  `"use strict"; return x **= 123;`,
  `
    {
      let right;
      return (
        right = intrinsic.aran.binary("**", [x], 123),
        (
          [x] = right,
          right
        )
      );
    }
  `,
);

testAssignment(
  `return (123)[456] = 789;`,
  `{ return intrinsic.aran.setSloppy(123, 456, 789); }`,
);

testAssignment(
  `return (123)[456] **= 789;`,
  `
    {
      let object, property;
      return (
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

testAssignment(
  `"use strict"; return [x] = 123;`,
  `
    {
      let right, right_pattern, iterator;
      return (
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

// test(`{ x = 123; }`, `{ [x] = 123; }`);
//
// test(`{ x **= 123; }`, `{ [x] = intrinsic.aran.binary("**", [x], 123); }`);
//
// test(`{ [x] = 123; }`, `{ void "ArrayPattern"; }`);
