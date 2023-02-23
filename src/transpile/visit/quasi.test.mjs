import { testExpression } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";

testExpression(
  "quasi",
  "`foo`;",
  "body/0/expression/quasis/0",
  { quasi: QuasiVisitor },
  {},
  null,
  `"foo"`,
);
