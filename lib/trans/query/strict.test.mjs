import { assertEqual } from "../../test.fixture.mjs";
import { parseScript, parseModule } from "../../parse.fixture.mjs";
import { hasUseStrictDirective } from "./strict.mjs";
import { guardProgram } from "estree-sentry";

assertEqual(
  hasUseStrictDirective(guardProgram(parseScript("'foo'; 'use strict';")).body),
  true,
);

assertEqual(
  hasUseStrictDirective(guardProgram(parseModule("123;")).body),
  true,
);

assertEqual(
  hasUseStrictDirective(guardProgram(parseScript("123; 'use strict';")).body),
  false,
);
