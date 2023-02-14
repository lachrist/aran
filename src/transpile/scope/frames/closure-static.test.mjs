import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./closure-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: `
      let VARIABLE;
      VARIABLE = undefined;
      specifier << undefined;
    `,
    scenarios: [
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        declared: false,
      },
      {
        type: "initialize",
        kind: "let",
        variable: "variable",
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
        kind: "var",
        variable: "variable",
        options: { exports: ["specifier"] },
        declared: true,
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `
          VARIABLE = 'right';
          specifier << VARIABLE;
        `,
        initialized: true,
      },
      {
        type: "write",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `(
          VARIABLE = 'right',
          specifier << VARIABLE
        )`,
      },
    ],
  }),
);
