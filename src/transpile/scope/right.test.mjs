import {assertEqual, assertDeepEqual, assertThrow} from "../../__fixture__.mjs";

import {makeLiteralExpression} from "../../ast/index.mjs";

import {
  makeRead,
  makeTypeof,
  isRead,
  isWrite,
  makePureWrite,
  makeImpureWrite,
  getWriteExpression,
} from "./right.mjs";

assertEqual(isRead(makeRead()), true);

assertEqual(isRead(makeTypeof()), false);

assertEqual(isWrite(makeRead()), false);

{
  const right = makePureWrite(makeLiteralExpression(123));
  assertEqual(isWrite(right), true);
  assertDeepEqual(getWriteExpression(right), makeLiteralExpression(123));
  assertDeepEqual(getWriteExpression(right), makeLiteralExpression(123));
}

{
  const right = makeImpureWrite(makeLiteralExpression(123));
  assertEqual(isWrite(right), true);
  assertDeepEqual(getWriteExpression(right), makeLiteralExpression(123));
  assertThrow(() => getWriteExpression(right), {
    name: "AssertionError",
    message: "impure right expression should only be used once",
  });
}
