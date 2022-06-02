import {assertSuccess} from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  allignEffect,
  allignStatement,
  allignExpression,
} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

import {
  makeDynamicLookupExpression,
  makeThrowDuplicateExpression,
  makeThrowMissingExpression,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeExportStatement,
  makeExportUndefinedStatement,
  makeExportSequenceEffect,
} from "./helper.mjs";

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      true,
      makeLiteralExpression("object"),
      makeLiteralExpression("key"),
      makeRead(),
    ),
    "intrinsic.aran.get('object', 'key')",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      true,
      makeLiteralExpression("object"),
      makeLiteralExpression("key"),
      makeTypeof(),
    ),
    "intrinsic.aran.unary('typeof', intrinsic.aran.get('object', 'key'))",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      true,
      makeLiteralExpression("object"),
      makeLiteralExpression("key"),
      makeDiscard(),
    ),
    "intrinsic.aran.deleteStrict('object', 'key')",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      false,
      makeLiteralExpression("object"),
      makeLiteralExpression("key"),
      makeWrite(makeLiteralExpression("right")),
    ),
    "intrinsic.aran.setSloppy('object', 'key', 'right')",
  ),
);

assertSuccess(
  allignExpression(
    makeThrowDuplicateExpression("variable"),
    `intrinsic.aran.throw(new intrinsic.SyntaxError("Variable 'variable' has already been declared"))`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowMissingExpression("variable"),
    `intrinsic.aran.throw(new intrinsic.ReferenceError("Variable 'variable' is not defined"))`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowDeadzoneExpression("variable"),
    `intrinsic.aran.throw(new intrinsic.ReferenceError("Cannot access variable 'variable' before initialization"))`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowConstantExpression("variable"),
    `intrinsic.aran.throw(new intrinsic.TypeError("Cannot assign variable 'variable' because it is a constant"))`,
  ),
);

assertSuccess(
  allignStatement(
    makeExportStatement("specifier", makeLiteralExpression(123)),
    `exportStatic('specifier', 123);`,
  ),
);

assertSuccess(
  allignStatement(
    makeExportUndefinedStatement("specifier"),
    `exportStatic('specifier', undefined);`,
  ),
);

assertSuccess(
  allignEffect(
    makeExportSequenceEffect(
      makeExpressionEffect(makeLiteralExpression(123)),
      "specifier",
      makeLiteralExpression(456),
    ),
    `(effect(123), exportStatic('specifier', 456))`,
  ),
);
