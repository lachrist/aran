import { assertEqual } from "../../__fixture__.mjs";
import { makeApplyExpression } from "../../ast/index.mjs";
import { visitMany } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import PropertyVisitor from "./property.mjs";
import CalleeVisitor from "./callee.mjs";

const Visitor = {
  ...TestVisitor,
  Expression: {
    ...TestVisitor.Expression,
    CallExpression: (node, context, _site) => {
      assertEqual(node.arguments.length, 0);
      const { 0: expression1, 1: expression2 } = visitMany(
        "Callee",
        node.callee,
        context,
        null,
      );
      return makeApplyExpression(expression1, expression2, []);
    },
  },
  ...PropertyVisitor,
  ...CalleeVisitor,
};

const testCallee = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testCallee(`(123)();`, `{ void (123)(); }`);

testCallee(`super.key();`, `{ void ("super.get")("key")(!"this"); }`);

testCallee(
  `(123)[456]();`,
  `
    {
      let callee_this;
      void (
        callee_this = 123,
        intrinsic.aran.get(callee_this, 456)
      )(!callee_this);
    }
  `,
);

testCallee(
  `((123)?.[456])();`,
  `
    {
      let callee_this;
      void (
        callee_this = 123,
        (
          (
            intrinsic.aran.binary("===", callee_this, null) ?
            true :
            intrinsic.aran.binary("===", callee_this, undefined)
          ) ?
          undefined :
          intrinsic.aran.get(callee_this, 456)
        )
      )(!callee_this);
    }
  `,
);
