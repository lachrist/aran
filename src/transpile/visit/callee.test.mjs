import { testBlock } from "./__fixture__.mjs";
import CalleeVisitor from "./callee.mjs";

const visitors = {
  block: {
    BlockStatement: (node, context1, _site) => makeScopeTestBlock(
      context1,
      (context2) => flatMap(
        node.body,
        partialx_xx(visitMultiple, "statement", context2, {}),
      ),
    ),
  },
  statement: {
    ExpressionStatement: (node, context, _site) =>
      makeEffectStatement(makeExpressionEffect(expression)),
    },
  },
  callee: CalleeVisitor,
};

const test = (input, output) =>
  testBlock(
    "callee",
    input,
    "body/0/expression",
    { callee: CalleeVisitor },
    {},
    null,
    output,
  );

test(
  `{ (123).key; }`,
  `
    {
      let callee_this;
    }
  `,
);
