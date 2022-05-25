import {assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {makeLiteralExpression} from "../../ast/index.mjs";

import {
  makeRead,
  makeTypeof,
  isRead,
  isWrite,
  makeWrite,
  accessWrite,
  accountWrite,
} from "./right.mjs";

assertEqual(isRead(makeRead()), true);

assertEqual(isRead(makeTypeof()), false);

assertEqual(isWrite(makeRead()), false);

{
  const right = makeWrite(makeLiteralExpression(123));
  assertEqual(isWrite(right), true);
  assertDeepEqual(accessWrite(right), makeLiteralExpression(123));
  assertDeepEqual(accessWrite(right), makeLiteralExpression(123));
  assertEqual(accountWrite(right), 2);
}
