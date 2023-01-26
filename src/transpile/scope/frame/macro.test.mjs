import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./macro.mjs";

assertSuccess(
  testBlock(Frame, {
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
        kind: "macro",
        variable: "variable",
        options: {
          macro: makeLiteralExpression("macro"),
        },
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
            "Cannot assign variable 'variable' because it is constant",
          ),
        )`,
      },
    ],
  }),
);
