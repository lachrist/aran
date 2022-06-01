import {assertSuccess} from "../__fixture__.mjs";

import {allignProgram} from "../allign/index.mjs";

import {parseProgram} from "../lang/index.mjs";

import {instrumentProgram} from "./index.mjs";

const {Error} = globalThis;

{
  const code = `"script"; return 123;`;
  assertSuccess(
    allignProgram(
      instrumentProgram("scope", "traps", false, parseProgram(code), {
        unmangleLabel: (_label) => {
          throw new Error("unexpected label");
        },
        unmangleVariable: (_variable) => {
          throw new Error("unexpected variable");
        },
      }),
      code,
    ),
  );
}
