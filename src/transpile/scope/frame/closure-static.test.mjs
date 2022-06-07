import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./closure-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        import: null,
        exports: ["specifier"],
        code: `(
          VARIABLE = undefined,
          exportStatic('specifier', VARIABLE)
        );`,
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
