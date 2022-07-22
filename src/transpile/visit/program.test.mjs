import {parse as parseAcorn} from "acorn";

import {assertSuccess} from "../../__fixture__.mjs";

import {createCounter} from "../../util/index.mjs";

import {allignProgram} from "../../allign/index.mjs";

import {createContext} from "./context.mjs";

import {
  MODULE,
  SCRIPT,
  // GLOBAL_EVAL,
  // INTERNAL_LOCAL_EVAL,
  // EXTERNAL_LOCAL_EVAL,
  visitProgram,
} from "./program.mjs";

export const testProgram = (code1, code2, specific) => {
  specific = {
    type: MODULE,
    specials: [],
    enclave: false,
    ...specific,
  };
  assertSuccess(
    allignProgram(
      visitProgram(
        parseAcorn(code1, {
          ecmaVersion: 2021,
          sourceType: specific.type === MODULE ? "module" : "script",
        }),
        createContext({
          nodes: [],
          storage: {},
          counter: createCounter(0),
        }),
        specific,
      ),
      code2,
    ),
  );
};

testProgram(
  "123;",
  `
    "script";
    return 123;
  `,
  {type: SCRIPT},
);
