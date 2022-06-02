import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./root-miss.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    scenarios: [
      {
        type: "read",
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.ReferenceError("Variable 'variable' is not defined"),
        )`,
      },
      {
        type: "typeof",
        output: "expression",
        code: "'undefined'",
      },
      {
        type: "discard",
        output: "expression",
        code: "true",
      },
      {
        type: "write",
        output: "expression",
        variable: "variable",
        strict: true,
        code: `intrinsic.aran.throw(
          new intrinsic.ReferenceError("Variable 'variable' is not defined"),
        )`,
      },
      {
        type: "write",
        output: "expression",
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "intrinsic.aran.setSloppy('dynamic', 'variable', 'right')",
      },
    ],
  }),
);
