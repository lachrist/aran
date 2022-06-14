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
        kind: "let",
        variable: "variable",
        options: {exports: []},
      },
      {
        type: "initialize",
        kind: "const",
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
        strict: false,
        variable: "variable",
        code: "false",
      },
      {
        type: "discard",
        strict: true,
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot discard variable 'variable' because it is static",
          ),
        )`,
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

assertSuccess(
  testBlock(Frame, {
    options: {distant: true},
    head: `
      let VARIABLE, _VARIABLE;
      _VARIABLE = false;
    `,
    scenarios: [
      {
        type: "declare",
        kind: "const",
        variable: "variable",
        options: {exports: ["specifier"]},
      },
      {
        type: "read",
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
          _VARIABLE = true;
          exportStatic('specifier', VARIABLE);
        `,
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
