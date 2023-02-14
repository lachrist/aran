import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./block-static-dead.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        variable: "VARIABLE",
        kind: "var",
        declared: false,
      },
      {
        type: "initialize",
        variable: "VARIABLE",
        kind: "var",
        initialized: false,
      },
      {
        type: "read",
        variable: "variable",
        next: (_strict, _frame, _scope, _escaped, _variable, _options) =>
          makeLiteralExpression("next"),
        code: `"next"`,
      },
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        options: { exports: [] },
        declared: true,
      },
      {
        type: "discard",
        variable: "variable",
        code: "false",
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
    ],
  }),
);
