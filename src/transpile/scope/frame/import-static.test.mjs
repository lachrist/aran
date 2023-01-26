import { assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./import-static.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "read",
        variable: "variable",
        next: () => makeLiteralExpression("next"),
        code: `"next"`,
      },
      {
        type: "conflict",
        variable: "variable",
      },
      {
        type: "declare",
        kind: "import",
        variable: "variable",
        options: {
          source: "source",
          specifier: "specifier",
        },
      },
      {
        type: "read",
        variable: "variable",
        code: "'source' >> specifier",
      },
      {
        type: "typeof",
        variable: "variable",
        code: `intrinsic.aran.unary(
          'typeof',
          'source' >> specifier,
        )`,
      },
      {
        type: "discard",
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        variable: "variable",
        code: `void intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot assign variable 'variable' because it is constant",
          ),
        )`,
      },
    ],
  }),
);
