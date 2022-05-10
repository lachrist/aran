import {assertSuccess} from "../__fixture__.mjs";

import {allignProgram} from "../allign/index.mjs";

import {parseProgram} from "../lang/index.mjs";

import {instrumentProgram} from "./index.mjs";

{
  const code = `"script"; return 123;`;
  assertSuccess(
    allignProgram(
      instrumentProgram("scope", "traps", false, parseProgram(code)),
      code,
    ),
  );
}
