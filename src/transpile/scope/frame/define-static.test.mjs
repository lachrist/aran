import {assertSuccess} from "../../../__fixture__.mjs";

import {testBlock} from "./__fixture__.mjs";

import * as Frame from "./define-static.mjs";

assertSuccess(
  testBlock(Frame, {
    head: "let VARIABLE;",
    scenarios: [
      {
        type: "declare",
        kind: "define",
        variable: "variable",
      },
      {
        type: "read",
        output: "expression",
        variable: "variable",
        code: "VARIABLE",
      },
    ],
  }),
);
