import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./closure-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: `
      let VARIABLE;
      VARIABLE = undefined;
      exportStatic('specifier', undefined);
    `,
    scenarios: [
      {
        type: "declare",
        kind: "var",
        variable: "variable",
        options: { exports: ["specifier"] },
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
        type: "write",
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
