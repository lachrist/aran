import { makeGetExpression } from "../../intrinsic.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import PropertyVisitor from "./property.mjs";

const Visitor = {
  ...TestVisitor,
  Expression: {
    ...TestVisitor.Expression,
    MemberExpression: (node, context, _site) =>
      makeGetExpression(
        visit("Expression", node.object, context, { name: null }),
        visit("Property", node.property, context, node),
      ),
  },
  ...PropertyVisitor,
};

const testProperty = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testProperty(`(123)[456];`, `{ void intrinsic.aran.get(123, 456); }`);
testProperty(`(123).name;`, `{ void intrinsic.aran.get(123, "name"); }`);
testProperty(`(123)[name];`, `{ void intrinsic.aran.get(123, [name]); }`);
testProperty(
  `(123)[this];`,
  `{ void intrinsic.aran.get(123, "ThisExpression"); }`,
);
