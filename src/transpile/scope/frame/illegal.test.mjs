import {assertThrow} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./illegal.mjs";

assertThrow(
  () =>
    testBlock(Frame, {
      scenarios: [
        {
          type: "declare",
          kind: "illegal",
          variable: "variable",
          options: {
            name: "name",
          },
          code: "effect('dummy');",
        },
        {
          type: "read",
          output: "expression",
          next: () => makeLiteralExpression("next"),
          code: "'dummy'",
        },
        {
          type: "read",
          output: "expression",
          variable: "variable",
          code: "'dummy'",
        },
      ],
    }),
  {
    name: "Error",
    message: "Illegal name",
  },
);
