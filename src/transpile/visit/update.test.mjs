import { assertNotEqual } from "../../__fixture__.mjs";
import { makeReturnStatement } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import UpdateVisitor from "./update.mjs";

const Visitor = {
  ...TestVisitor,
  ...KeyVisitor,
  ...UpdateVisitor,
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
  Expression: {
    ...TestVisitor.Expression,
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        type: "UpdateExpression",
        prefix: node.prefix,
        operator: node.operator,
      }),
  },
};

const testUpdate = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

//////////////////
// UpdateEffect //
//////////////////

testUpdate(
  `"use strict"; x++;`,
  `{ [x] = intrinsic.aran.binary("+", [x], 1); }`,
);

testUpdate(
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

//////////////////////
// UpdateExpression //
//////////////////////

testUpdate(
  `"use strict"; return ++x;`,
  `
    {
      let result;
      return (
        result = intrinsic.aran.binary("+", [x], 1),
        (
          [x] = result,
          result
        )
      );
    }
  `,
);

testUpdate(
  `"use strict"; return x++;`,
  `
    {
      let result;
      return (
        result = [x],
        (
          [x] = intrinsic.aran.binary("+", result, 1),
          result
        )
      );
    }
  `,
);

testUpdate(
  `return ++(123)[456];`,
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

testUpdate(
  `return (123)[456]++;`,
  `
    {
      let object, property, value;
      return (
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
