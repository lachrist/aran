import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./intrinsic.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        variable: "variable",
        options: {
          intrinsic: "ReferenceError",
        },
        code: "",
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
        code: "intrinsic.ReferenceError",
      },
      {
        type: "typeof",
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.unary(
          'typeof',
          intrinsic.ReferenceError,
        )`,
      },
      {
        type: "discard",
        output: "expression",
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        output: "expression",
        variable: "variable",
        code: "undefined",
      },
    ],
  }),
);
