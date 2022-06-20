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
        variable: "variable",
        kind: "define",
      },
      {
        type: "read",
        variable: "variable",
        code: "intrinsic.aran.get('dynamic', 'variable')",
      },
    ],
  }),
);
