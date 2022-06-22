import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./enclave.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      macros: {
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
        type: "discard",
        strict: true,
        variable: "variable",
        code: "('discardStrict')('variable')",
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "('discardSloppy')('variable')",
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          ('writeStrict')('variable', 'right'),
        )`,
      },
      {
        type: "write",
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          ('writeSloppy')('variable', 'right'),
        )`,
      },
    ],
  }),
);
