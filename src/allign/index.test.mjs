import { assertSuccess, assertFailure } from "../__fixture__.mjs";
import { makeLiteralExpression } from "../ast/index.mjs";
import { allignExpression } from "./index.mjs";

assertSuccess(allignExpression(makeLiteralExpression(123), "123;"));

assertFailure(allignExpression(makeLiteralExpression(123), "456;"));
