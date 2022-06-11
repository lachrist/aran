import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./enclave.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      enclaves: {
        read: makeLiteralExpression("read"),
        typeof: makeLiteralExpression("typeof"),
        discardStrict: makeLiteralExpression("discardStrict"),
        discardSloppy: makeLiteralExpression("discardSloppy"),
        writeStrict: makeLiteralExpression("writeStrict"),
        writeSloppy: makeLiteralExpression("writeSloppy"),
      },
    },
    scenarios: [
      {
        type: "declare",
        kind: "var",
        options: {exports: []},
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
        variable: "variable",
        code: "('read')('variable')",
      },
      {
        type: "typeof",
        output: "expression",
        variable: "variable",
        code: "('typeof')('variable')",
      },
      {
        type: "discard",
        output: "expression",
        strict: true,
        variable: "variable",
        code: "('discardStrict')('variable')",
      },
      {
        type: "discard",
        output: "expression",
        strict: false,
        variable: "variable",
        code: "('discardSloppy')('variable')",
      },
      {
        type: "write",
        output: "expression",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "('writeStrict')('variable', 'right')",
      },
      {
        type: "write",
        output: "expression",
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "('writeSloppy')('variable', 'right')",
      },
    ],
  }),
);
