import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-happy.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let variable;",
    scenarios: [
      {
        type: "read",
        next: () => makeLiteralExpression("next"),
        code: "'next'",
      },
      {
        type: "declare",
        code: "",
      },
      {
        type: "initialize",
        initialization: "initialization",
        code: "variable = 'initialization';",
      },
      {
        type: "read",
        code: "variable",
      },
      {
        type: "typeof",
        code: "intrinsic.aran.unary('typeof', variable)",
      },
      {
        type: "discard",
        code: "false",
      },
      {
        type: "write",
        assignment: "assignment",
        code: "variable = 'assignment'",
      },
    ],
  }),
);
