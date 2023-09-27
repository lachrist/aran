import { assertEqual } from "../__fixture__.mjs";
import { parseScript, parseModule } from "../__fixture__parser__.mjs";
import { isProgramStrict, isClosureStrict } from "./strict.mjs";

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
