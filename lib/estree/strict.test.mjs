import { drill, assertEqual } from "../fixture.mjs";
import { parseScript, parseModule } from "../fixture-parse.mjs";
import { isProgramStrict, isClosureStrict } from "./strict.mjs";

assertEqual(isProgramStrict(parseScript("'foo'; 'use strict';")), true);
assertEqual(isProgramStrict(parseModule("123;")), true);
assertEqual(isProgramStrict(parseScript("123; 'use strict';")), false);

assertEqual(
  isClosureStrict(
    /** @type {EstreeFunction} */ (
      drill(parseScript("(() => 123);"), ["body", 0, "expression"])
    ),
  ),
  false,
);

assertEqual(
  isClosureStrict(
    /** @type {EstreeFunction} */ (
      drill(parseScript("(() => { 'foo'; 'use strict'; });"), [
        "body",
        0,
        "expression",
      ])
    ),
  ),
  true,
);
assertEqual(
  isClosureStrict(
    /** @type {EstreeFunction} */ (
      drill(parseScript("(() => { 123; 'use strict'; });"), [
        "body",
        0,
        "expression",
      ])
    ),
  ),
  false,
);
