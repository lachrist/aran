import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./block-static-dead.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        options: { exports: [] },
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `void intrinsic.aran.throw(
          new intrinsic.ReferenceError(
            "Cannot access variable 'variable' before initialization",
          ),
        )`,
      },
    ],
  }),
);
