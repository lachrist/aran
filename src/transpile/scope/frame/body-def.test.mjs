import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-def.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "declare",
        variable: "variable",
        code: "",
      },
      {
        type: "initialize",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "VARIABLE = 'right';",
      },
      {
        type: "read",
        output: "expression",
        next: () => makeLiteralExpression("next"),
        code: "'next'",
      },
      {
        type: "read",
        output: "expression",
        variable: "variable",
        code: "VARIABLE",
      },
    ],
  }),
);
