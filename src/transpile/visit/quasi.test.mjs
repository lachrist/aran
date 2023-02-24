import { testExpression } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";

testExpression(
  "quasi",
  "`foo\\bar`;",
  "body/0/expression/quasis/0",
  { visitors: { quasi: QuasiVisitor } },
  { cooked: true },
  `"foo\\bar"`,
);

testExpression(
  "quasi",
  "`foo\\bar`;",
  "body/0/expression/quasis/0",
  { visitors: { quasi: QuasiVisitor } },
  { cooked: false },
  `"foo\\\\bar"`,
);
