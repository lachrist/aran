import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./import-static.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "conflict",
        kind: "import",
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
        code: "",
      },
      {
        type: "read",
        output: "expression",
        next: () => makeLiteralExpression("next"),
        code: "'next'",
      },
      {
        type: "read",
        output: "expression",
        variable: "variable",
        code: "importStatic('source', 'specifier')",
      },
      {
        type: "typeof",
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.unary(
          'typeof',
          importStatic('source', 'specifier'),
        )`,
      },
      {
        type: "discard",
        output: "expression",
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.TypeError("Cannot assign variable 'variable' because it is a constant"),
        )`,
      },
    ],
  }),
);
