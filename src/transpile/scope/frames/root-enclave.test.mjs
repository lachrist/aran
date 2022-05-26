import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./root-enclave.mjs";

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
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        initialization: "initialization",
        code: "var variable = 'initialization';",
      },
      {
        type: "read",
        strict: true,
        variable: "variable",
        code: "('read-strict')('variable')",
      },
      {
        type: "read",
        strict: false,
        variable: "variable",
        code: "('read-sloppy')('variable')",
      },
      {
        type: "typeof",
        strict: true,
        variable: "variable",
        code: "('typeof-strict')('variable')",
      },
      {
        type: "typeof",
        strict: false,
        variable: "variable",
        code: "('typeof-sloppy')('variable')",
      },
      {
        type: "discard",
        strict: true,
        variable: "variable",
        code: "('discard-strict')('variable')",
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "('discard-sloppy')('variable')",
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        assignment: "assignment",
        code: "effect(('write-strict')('variable', 'assignment'))",
      },
      {
        type: "write",
        strict: false,
        variable: "variable",
        assignment: "assignment",
        code: "effect(('write-sloppy')('variable', 'assignment'))",
      },
    ],
  }),
);
