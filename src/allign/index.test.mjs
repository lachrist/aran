import {assertEqual} from "../__fixture__.mjs";
import {makePrimitiveExpression} from "../ast/index.mjs";
import {allignExpression} from "./index.mjs";

assertEqual(allignExpression(makePrimitiveExpression(null, 123), "123;"), null);

assertEqual(
  typeof allignExpression(makePrimitiveExpression(null, 123), "456;"),
  "string",
);
