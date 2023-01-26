import { assertThrow, assertSuccess } from "../../../__fixture__.mjs";

import { makeLiteralExpression } from "../../../ast/index.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./enclave.mjs";

assertSuccess(
  testBlock(Frame, {
    options: {},
    scenarios: [
      {
        type: "declare",
        kind: "var",
        options: { exports: [] },
        code: "",
      },
      {
        type: "initialize",
        kind: "var",
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: "var [variable] = 'right';",
      },
      {
        type: "read",
        variable: "variable",
        code: `[variable]`,
      },
      {
        type: "typeof",
        variable: "variable",
        code: `typeof [variable]`,
      },
      {
        type: "write",
        strict: true,
        variable: "variable",
        right: makeLiteralExpression("right"),
        code: `[variable] = "right"`,
      },
    ],
  }),
);

assertThrow(
  () =>
    testBlock(Frame, {
      options: {},
      scenarios: [
        {
          type: "discard",
          variable: "variable",
        },
      ],
    }),
  { name: "EnclaveLimitationAranError" },
);

assertThrow(
  () =>
    testBlock(Frame, {
      options: {},
      scenarios: [
        {
          type: "write",
          strict: false,
          variable: "variable",
        },
      ],
    }),
  { name: "EnclaveLimitationAranError" },
);
