import { assertSuccess, assertFailure } from "../__fixture__.mjs";
import { makeLiteralExpression } from "../ast/index.mjs";
import { allign } from "./index.mjs";

assertSuccess(allign("expression", makeLiteralExpression(123), "123;"));

assertFailure(
  allign(
    "expression",
    makeLiteralExpression(123),
    `
      (
        void function () { return 456; },
        function () { return 789; }
      );
    `,
  ),
);
