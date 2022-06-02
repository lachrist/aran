import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-happy.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "read",
        output: "expression",
        next: () => makeLiteralExpression("next"),
        code: "'next'",
      },
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
        variable: "variable",
        code: "VARIABLE",
      },
      {
        type: "typeof",
        output: "expression",
        variable: "variable",
        code: "intrinsic.aran.unary('typeof', VARIABLE)",
      },
      {
        type: "discard",
        output: "expression",
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        output: "effect",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "VARIABLE = 'right'",
      },
    ],
  }),
);
