import {assertEqual} from "../__fixture__.mjs";
import {makePrimitiveExpression} from "../ast/index.mjs";
import {allignExpression} from "./index.mjs";

assertEqual(allignExpression(makePrimitiveExpression(123), "123;"), null);

assertEqual(
  typeof allignExpression(makePrimitiveExpression(123), "456;"),
  "string",
);
