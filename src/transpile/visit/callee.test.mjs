import { testBlock } from "./__fixture__.mjs";
import CalleeVisitor from "./callee.mjs";

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
