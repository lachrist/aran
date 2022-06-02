import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./body-import.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "declare",
        kind: "kind",
      },
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
        type: "initialize",
        kind: "kind",
      },
      {
        type: "read",
        variable: "VARIABLE",
        next: () => makeLiteralExpression("next"),
        code: "'next'",
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
        variable: "variable",
        code: "false",
      },
      {
        type: "write",
        variable: "variable",
        code: `effect(
          intrinsic.aran.throw(
            new intrinsic.TypeError("Cannot assign variable 'variable' because it is a constant"),
          ),
        )`,
      },
    ],
  }),
);
