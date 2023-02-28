import { testExpression } from "./__fixture__.mjs";
import visitors from "./quasi.mjs";

testExpression(
  "Quasi",
  "`foo\\bar`;",
  "body/0/expression/quasis/0",
  { visitors },
  { cooked: true },
  `"foo\\bar"`,
);

testExpression(
  "Quasi",
  "`foo\\bar`;",
  "body/0/expression/quasis/0",
  { visitors },
  { cooked: false },
  `"foo\\\\bar"`,
);
