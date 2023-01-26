import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./define-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "read",
        variable: "variable",
        next: () => makeLiteralExpression("next"),
        code: `"next"`,
      },
      {
        type: "conflict",
        variable: "variable",
      },
      {
        type: "declare",
        kind: "define",
        variable: "variable",
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
