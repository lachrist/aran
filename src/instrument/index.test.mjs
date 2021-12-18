import {assertEqual} from "../__fixture__.mjs";
import {allignProgram} from "../allign/index.mjs";
import {parseProgram} from "../lang/index.mjs";
import {instrumentProgram} from "./index.mjs";

{
  const code = `"script"; return 123;`;
  assertEqual(
    allignProgram(
      instrumentProgram("scope", "traps", false, parseProgram(code)),
      code,
    ),
    null,
  );
}
