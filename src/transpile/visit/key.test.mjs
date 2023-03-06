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
        visit(node.property, context, { type: "Key" }),
      ),
  },
  Key: KeyVisitor,
};

const testKey = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testKey(`("obj")["key"];`, `{ void intrinsic.aran.get("obj", "key"); }`);
testKey(`("obj").key;`, `{ void intrinsic.aran.get("obj", "key"); }`);
