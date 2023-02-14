import { assertThrow } from "../../../__fixture__.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./illegal.mjs";

assertThrow(
  () =>
    testBlock(Frame, {
      scenarios: [
        {
          type: "conflict",
          variable: "variable",
        },
        {
          type: "declare",
          kind: "illegal",
          variable: "variable",
        },
        {
          type: "read",
          variable: "variable",
        },
      ],
    }),
  { name: "SyntaxAranError" },
);
