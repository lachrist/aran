import { assertSuccess } from "../../__fixture__.mjs";

import { makeLiteralExpression } from "../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./empty-void.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {
      pure: makeLiteralExpression("dynamic"),
    },
    scenarios: [
      {
        type: "read",
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Variable \\"variable\\" is not defined",
          ),
        )`,
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
        variable: "variable",
        strict: true,
        code: `void intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Variable \\"variable\\" is not defined",
          ),
        )`,
      },
      {
        type: "write",
        strict: false,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.aran.setSloppy('dynamic', 'variable', 'right')`,
      },
    ],
  }),
);
