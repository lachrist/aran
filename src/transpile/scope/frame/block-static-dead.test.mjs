import {assertSuccess} from "../../../__fixture__.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./block-static-dead.mjs";

assertSuccess(
  testBlock(Frame, {
    scenarios: [
      {
        type: "conflict",
        variable: "variable",
      },
      {
        type: "declare",
        kind: "let",
        variable: "variable",
        options: {exports: []},
      },
      {
        type: "discard",
        strict: false,
        output: "expression",
        variable: "variable",
        code: "false",
      },
      {
        type: "discard",
        strict: true,
        output: "expression",
        variable: "variable",
        code: `intrinsic.aran.throw(
          new intrinsic.TypeError(
            "Cannot discard variable 'variable' because it is static",
          ),
        )`,
      },
    ],
  }),
);
