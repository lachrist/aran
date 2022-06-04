import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-import.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        kind: "import",
        variable: "variable",
        import: {
          source: "source",
          specifier: "specifier",
        },
        exports: [],
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
