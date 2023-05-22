import { assertEqual, assertSuccess } from "../__fixture__.mjs";
import { makeLiteralExpression } from "../ast/index.mjs";
import { allignEffect, allignExpression } from "../allign/index.mjs";
import {
  makeRootScope,
  extendScope,
  lookupScope,
  makeScopeReadExpression,
  makeScopeWriteEffect,
} from "./scope.mjs";

assertEqual(
  lookupScope(
    extendScope(makeRootScope("prefix_", [["foo", 123]]), [["bar", 456]]),
    "foo",
  ),
  123,
);

assertSuccess(
  allignExpression(
    makeScopeReadExpression(makeRootScope("prefix_", [["foo", 123]]), "foo"),
    `[prefix_foo]`,
  ),
);

assertSuccess(
  allignEffect(
    makeScopeWriteEffect(
      makeRootScope("prefix_", [["foo", 123]]),
      "foo",
      makeLiteralExpression(456),
    ),
    `[prefix_foo] = 456`,
  ),
);
