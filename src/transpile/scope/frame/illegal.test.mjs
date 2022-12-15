import { assertThrow } from "../../../__fixture__.mjs";

import { testBlock } from "./__fixture__.mjs";

import * as Frame from "./illegal.mjs";

assertThrow(
  () =>
    testBlock(Frame, {
      scenarios: [
        {
          type: "declare",
          kind: "illegal",
          variable: "variable",
          options: {
            name: "name",
          },
        },
        {
          type: "read",
          variable: "variable",
          code: "'dummy'",
        },
      ],
    }),
  {
    name: "Error",
    message: "Illegal name",
  },
);
