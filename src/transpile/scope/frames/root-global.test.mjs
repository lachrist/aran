import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {testScript} from "./__fixture__.mjs";

import * as Frame from "./root-global.mjs";

assertSuccess(
  testScript(Frame, {
    scenarios: [
      {
        type: "declare",
        kind: "const",
        code: "",
      },
      {
        type: "initialize",
        kind: "const",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "const variable = 'right';",
      },
      {
        type: "read",
        variable: "variable",
        code: "intrinsic.aran.getGlobal('variable')",
      },
      {
        type: "typeof",
        variable: "variable",
        code: "intrinsic.aran.typeofGlobal('variable')",
      },
      {
        type: "discard",
        strict: false,
        variable: "variable",
        code: "intrinsic.aran.deleteGlobalSloppy('variable')",
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `effect(
          intrinsic.aran.setGlobalStrict('variable', 'right'),
        )`,
      },
    ],
  }),
);
