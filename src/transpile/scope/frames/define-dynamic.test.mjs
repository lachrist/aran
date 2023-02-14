import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./define-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macro: makeLiteralExpression("dynamic"),
    },
    scenarios: [
      {
        type: "read",
        variable: "variable",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `"next"`,
      },
      {
        type: "conflict",
        variable: "variable",
      },
      {
        type: "declare",
        variable: "variable",
        kind: "define",
      },
      {
        type: "write",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "void intrinsic.aran.setStrict('dynamic', 'variable', 'right')",
      },
    ],
  }),
);
