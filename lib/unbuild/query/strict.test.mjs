import { assertEqual } from "../../test.fixture.mjs";
import { parseScript, parseModule } from "../../parse.fixture.mjs";
import { hasUseStrictDirective } from "./strict.mjs";

assertEqual(
  hasUseStrictDirective(parseScript("'foo'; 'use strict';").body),
  true,
);

assertEqual(hasUseStrictDirective(parseModule("123;").body), true);

assertEqual(
  hasUseStrictDirective(parseScript("123; 'use strict';").body),
  false,
);
