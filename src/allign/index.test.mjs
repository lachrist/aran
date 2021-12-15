import {assertEqual} from "../__fixture__.mjs";
import {makeLiteralExpression} from "../ast/index.mjs";
import {allignExpression} from "./index.mjs";

assertEqual(allignExpression(makeLiteralExpression(123), "123;"), null);

assertEqual(
  typeof allignExpression(makeLiteralExpression(123), "456;"),
  "string",
);
