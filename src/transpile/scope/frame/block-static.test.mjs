import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./block-static.mjs";

assertSuccess(
  testBlock(Frame, {
    options: { distant: false },
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        options: { exports: ["specifier"] },
      },
      {
        type: "read",
        escaped: false,
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        )`,
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "false",
      },
      {
        type: "initialize",
        kind: "let",
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

assertSuccess(
  testBlock(Frame, {
    options: { distant: true },
    head: `
      let VARIABLE, _VARIABLE;
      _VARIABLE = false;
    `,
    scenarios: [
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        options: { exports: [] },
      },
      {
        type: "lookup-all",
        strict: true,
        escaped: false,
      },
      {
        type: "initialize",
        kind: "const",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `
          VARIABLE = 'right';
          _VARIABLE = true;
        `,
      },
      {
        type: "lookup-all",
        strict: true,
        escaped: false,
      },
      {
        type: "write",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `
          _VARIABLE ?
          effect(
            intrinsic.aran.throw(
              new intrinsic.TypeError(
                "Cannot assign variable 'variable' because it is constant",
              ),
            ),
          ) :
          effect(
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable' before initialization",
              ),
            ),
          )
        `,
      },
    ],
  }),
);
