import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./enclave.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      read: {
        strict: makeLiteralExpression("read-strict"),
        sloppy: makeLiteralExpression("read-sloppy"),
      },
      typeof: {
        strict: makeLiteralExpression("typeof-strict"),
        sloppy: makeLiteralExpression("typeof-sloppy"),
      },
      discard: {
        strict: makeLiteralExpression("discard-strict"),
        sloppy: makeLiteralExpression("discard-sloppy"),
      },
      write: {
        strict: makeLiteralExpression("write-strict"),
        sloppy: makeLiteralExpression("write-sloppy"),
      },
    },
    scenarios: [
      {
        type: "declare",
        kind: "var",
        code: "",
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "var variable = 'right';",
      },
      {
        type: "read",
        output: "expression",
        strict: true,
        variable: "variable",
        code: "('read-strict')('variable')",
      },
      {
        type: "read",
        output: "expression",
        strict: false,
        variable: "variable",
        code: "('read-sloppy')('variable')",
      },
      {
        type: "typeof",
        output: "expression",
        strict: true,
        variable: "variable",
        code: "('typeof-strict')('variable')",
      },
      {
        type: "typeof",
        output: "expression",
        strict: false,
        variable: "variable",
        code: "('typeof-sloppy')('variable')",
      },
      {
        type: "discard",
        output: "expression",
        strict: true,
        variable: "variable",
        code: "('discard-strict')('variable')",
      },
      {
        type: "discard",
        output: "expression",
        strict: false,
        variable: "variable",
        code: "('discard-sloppy')('variable')",
      },
      {
        type: "write",
        output: "expression",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "('write-strict')('variable', 'right')",
      },
      {
        type: "write",
        output: "expression",
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "('write-sloppy')('variable', 'right')",
      },
    ],
  }),
);
