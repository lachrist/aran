import {parse as parseAcorn} from "acorn";
import {assertEqual} from "../__fixture__.mjs";
import {isProgramStrict, isClosureStrict} from "./strict.mjs";

const script_options = {
  sourceType: "script",
  ecmaVersion: 2021,
};
const parseScript = (code) => parseAcorn(code, script_options);

const module_options = {
  sourceType: "module",
  ecmaVersion: 2021,
};
const parseModule = (code) => parseAcorn(code, module_options);

assertEqual(isProgramStrict(parseScript("'foo'; 'use strict';")), true);
assertEqual(isProgramStrict(parseModule("123;")), true);
assertEqual(isProgramStrict(parseScript("123; 'use strict';")), false);

assertEqual(
  isClosureStrict(parseScript("(() => 123);").body[0].expression),
  false,
);
assertEqual(
  isClosureStrict(
    parseScript("(() => { 'foo'; 'use strict'; });").body[0].expression,
  ),
  true,
);
assertEqual(
  isClosureStrict(
    parseScript("(() => { 123; 'use strict'; });").body[0].expression,
  ),
  false,
);
