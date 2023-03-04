import TestVisitor, { test } from "./__fixture__.mjs";

test(`123;`, { visitors: TestVisitor }, {}, `{ void 123; }`);

test(
  `"use strict"; debugger; 123 + 456;`,
  { visitors: TestVisitor },
  {},
  `{ void "DebuggerStatement"; void "BinaryExpression"; }`,
);
