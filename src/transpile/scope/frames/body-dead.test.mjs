import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-dead.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "read",
        output: "expression",
        next: () => makeLiteralExpression("next"),
        code: "'next'",
      },
      {
        type: "declare",
        kind: "var",
        variable: "VARIABLE",
      },
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        code: "",
      },
      {
        type: "initialize",
        kind: "var",
        variable: "VARIABLE",
      },
      {
        type: "read",
        output: "expression",
        variable: "variable",
        code: "intrinsic.aran.throw(new intrinsic.ReferenceError('foo')",
      },
      {
        type: "discard",
        output: "expression",
        variable: "variable",
        code: "false",
      },
    ],
  }),
);
