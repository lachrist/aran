import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-closure.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "declare",
        kind: "kind",
      },
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        import: null,
        exports: ["specifier"],
        code: `
          VARIABLE = undefined;
          exportStatic('specifier', undefined);
        `,
      },
      {
        type: "initialize",
        kind: "kind",
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `
          VARIABLE = 'right';
          exportStatic('specifier', VARIABLE);
        `,
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
        code: `(
          VARIABLE = 'right',
          exportStatic('specifier', VARIABLE)
        )`,
      },
    ],
  }),
);
