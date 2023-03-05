import { makeGetExpression } from "../../intrinsic.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";

const Visitor = {
  ...TestVisitor,
  Expression: {
    ...TestVisitor.Expression,
    MemberExpression: (node, context, _site) =>
      makeGetExpression(
        visit(node.object, context, { type: "Expression", name: "" }),
        visit(node.property, context, { type: "Key", computed: node.computed }),
      ),
  },
  Key: KeyVisitor,
};

const testKey = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testKey(`(123)[456];`, `{ void intrinsic.aran.get(123, 456); }`);
testKey(`(123).name;`, `{ void intrinsic.aran.get(123, "name"); }`);
testKey(`(123)[name];`, `{ void intrinsic.aran.get(123, [name]); }`);
testKey(`(123)[this];`, `{ void intrinsic.aran.get(123, "ThisExpression"); }`);
