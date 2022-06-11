import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./define-dynamic.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    scenarios: [
      {
        type: "declare",
        kind: "def",
        code: "",
      },
      {
        type: "read",
        output: "expression",
        variable: "variable",
        code: "intrinsic.aran.get('dynamic', 'variable')",
      },
      {
        type: "typeof",
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.unary(
          'typeof',
          intrinsic.aran.get('dynamic', 'variable'),
        )`,
      },
      {
        type: "discard",
        output: "expression",
        variable: "variable",
        strict: false,
        code: "intrinsic.aran.deleteSloppy('dynamic', 'variable')",
      },
      {
        type: "write",
        output: "expression",
        variable: "variable",
        strict: true,
        right: makeLiteralExpression("right"),
        code: "intrinsic.aran.setStrict('dynamic', 'variable', 'right')",
      },
    ],
  }),
);
