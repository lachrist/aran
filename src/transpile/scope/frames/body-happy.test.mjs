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
        variable: "variable",
        code: "VARIABLE",
      },
      {
        type: "typeof",
        variable: "variable",
        code: "intrinsic.aran.unary('typeof', VARIABLE)",
      },
      {
        type: "discard",
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "VARIABLE = 'right'",
      },
    ],
  }),
);
