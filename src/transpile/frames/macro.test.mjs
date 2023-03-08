import { assertSuccess } from "../../__fixture__.mjs";

import { makeLiteralExpression } from "../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./macro.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        kind: "define",
        variable: "VARIABLE",
        declared: false,
      },
      {
        type: "initialize",
        kind: "define",
        variable: "VARIABLE",
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
        kind: "macro",
        variable: "variable",
        options: {
          macro: makeLiteralExpression("macro"),
        },
        declared: true,
      },
      {
        type: "read",
        variable: "variable",
        code: `"macro"`,
      },
      {
        type: "typeof",
        variable: "variable",
        code: `intrinsic.aran.unary("typeof", "macro")`,
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        variable: "variable",
        code: `void intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot assign variable \\"variable\\" because it is constant",
          ),
        )`,
      },
    ],
  }),
);
