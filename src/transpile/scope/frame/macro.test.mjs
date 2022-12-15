import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./macro.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        kind: "macro",
        variable: "variable",
        options: {
          binding: makeLiteralExpression("binding"),
        },
      },
      {
        type: "read",
        variable: "variable",
        code: "'binding'",
      },
      {
        type: "typeof",
        variable: "variable",
        code: `intrinsic.aran.unary('typeof', 'binding')`,
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
        code: `effect(
          intrinsic.aran.throw(
            new intrinsic.TypeError(
              "Cannot assign variable 'variable' because it is constant",
            ),
          ),
        )`,
      },
    ],
  }),
);
