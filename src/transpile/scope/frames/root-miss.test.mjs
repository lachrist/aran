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
        variable: "variable",
        code: `
          intrinsic.aran.throw(
            new intrinsic.ReferenceError('variable is not defined'),
          )
        `,
      },
      {
        type: "typeof",
        code: "'undefined'",
      },
      {
        type: "discard",
        code: "true",
      },
      {
        type: "write",
        strict: true,
        code: `
          effect(
            intrinsic.aran.throw(
              new intrinsic.ReferenceError('variable is not defined'),
            ),
          )
        `,
      },
      {
        type: "write",
        strict: false,
        variable: "variable",
        assignment: "assignment",
        code: `
          effect(
            intrinsic.aran.setSloppy('dynamic', 'variable', 'assignment'),
          )
        `,
      },
    ],
  }),
);
