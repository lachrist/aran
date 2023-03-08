import { assertThrow } from "../../__fixture__.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./illegal.mjs";

assertThrow(
  () =>
    testBlock(Frame, {
      scenarios: [
        {
          type: "declare",
          kind: "define",
          variable: "variable",
          declared: false,
        },
        {
          type: "initialize",
          kind: "define",
          variable: "variable",
          initialized: false,
        },
        {
          type: "declare",
          kind: "illegal",
          variable: "variable",
          declared: true,
        },
        {
          type: "read",
          variable: "variable",
        },
      ],
    }),
  { name: "SyntaxAranError" },
);
