import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./root-happy.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      dynamic: makeLiteralExpression("dynamic"),
    },
    scenarios: [
      {
        type: "declare",
        code: "",
      },
      {
        type: "initialize",
        variable: "variable",
        initialization: "initialization",
        code: `
          effect(
            intrinsic.aran.setStrict('dynamic', 'variable', 'initialization'),
          )
        `,
      },
      {
        type: "read",
        variable: "variable",
        code: "intrinsic.aran.get('dynamic', 'variable')",
      },
      {
        type: "typeof",
        code: `
          intrinsic.aran.unary(
            'typeof',
            intrinsic.aran.get('dynamic', 'variable'),
          )
        `,
      },
      {
        type: "discard",
        code: "false",
      },
      {
        type: "write",
        variable: "variable",
        assignment: "assignment",
        code: `
          effect(
            intrinsic.aran.setStrict('dynamic', 'variable', 'assignment'),
          )
        `,
      },
    ],
  }),
);
