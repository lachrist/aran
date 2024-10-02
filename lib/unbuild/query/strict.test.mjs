import { assertEqual } from "../../test.fixture.mjs";
import { parseScript, parseModule } from "../../parse.fixture.mjs";
import { hasUseStrictDirective } from "./strict.mjs";
import { guard } from "estree-sentry";

assertEqual(
  hasUseStrictDirective(guard(parseScript("'foo'; 'use strict';")).body),
  true,
);

assertEqual(hasUseStrictDirective(guard(parseModule("123;")).body), true);

assertEqual(
  hasUseStrictDirective(guard(parseScript("123; 'use strict';")).body),
  false,
);
