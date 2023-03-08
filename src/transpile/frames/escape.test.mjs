import { assertSuccess, assertDeepEqual } from "../../__fixture__.mjs";

import { makeLiteralExpression } from "../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./escape.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        strict: true,
        escaped: false,
        scope: "scope",
        type: "read",
        next: (strict, scope, escaped, variable, options) => {
          assertDeepEqual(
            { strict, scope, escaped, variable, options },
            {
              strict: true,
              scope: "scope",
              escaped: true,
              variable: "variable",
              options: null,
            },
          );
          return makeLiteralExpression("next");
        },
        variable: "variable",
        code: `"next"`,
      },
    ],
  }),
);
