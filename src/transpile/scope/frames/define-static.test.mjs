import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./define-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "declare",
        variable: "VARIABLE",
        kind: "var",
        declared: false,
      },
      {
        type: "initialize",
        variable: "VARIABLE",
        kind: "var",
        initialized: false,
      },
      {
        type: "read",
        variable: "variable",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `"next"`,
      },
      {
        type: "declare",
        kind: "define",
        variable: "variable",
        declared: true,
      },
      {
        type: "write",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `VARIABLE = "right"`,
      },
    ],
  }),
);
