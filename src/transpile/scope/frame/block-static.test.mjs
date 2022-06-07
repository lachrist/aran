import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./block-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "conflict",
        variable: "variable",
      },
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        import: null,
        exports: ["specifier"],
        code: "",
      },
      {
        type: "read",
        escaped: false,
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        )`,
      },
      {
        type: "initialize",
        kind: "const",
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
        type: "write",
        output: "expression",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot assign variable 'variable' because it is a constant",
          ),
        )`,
      },
    ],
  }),
);

assertSuccess(
  testBlock(Frame, {
    head: `
      let ORIGINAL, SHADOW;
      SHADOW = false;
    `,
    scenarios: [
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        import: null,
        exports: ["specifier"],
        code: "",
      },
      {
        type: "read",
        escaped: true,
        output: "expression",
        variable: "variable",
        code: `(
          SHADOW ?
          ORIGINAL :
          intrinsic.aran.throw(new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ))
        )`,
      },
      {
        type: "initialize",
        kind: "const",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `
          ORIGINAL = 'right';
          SHADOW = true;
          exportStatic('specifier', ORIGINAL);
        `,
      },
    ],
  }),
);
