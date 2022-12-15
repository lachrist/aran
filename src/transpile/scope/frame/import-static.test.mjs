import { assertSuccess } from "../../../__fixture__.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./import-static.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
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
        code: "importStatic('source', 'specifier')",
      },
      {
        type: "typeof",
        variable: "variable",
        code: `intrinsic.aran.unary(
          'typeof',
          importStatic('source', 'specifier'),
        )`,
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
