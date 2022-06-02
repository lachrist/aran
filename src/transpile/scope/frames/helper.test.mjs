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

import {BASE} from "../variable.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

import {
  makeStaticLookupExpression,
  makeDynamicLookupExpression,
  makeStaticLookupEffect,
  makeThrowDuplicateExpression,
  makeThrowMissingExpression,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeExportStatement,
  makeExportUndefinedStatement,
  makeExportSequenceEffect,
} from "./helper.mjs";

//////////////////////
// makeStaticLookup //
//////////////////////

assertSuccess(
  allignExpression(
    makeStaticLookupExpression(true, BASE, "variable", makeRead()),
    "variable",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupExpression(true, BASE, "variable", makeTypeof()),
    "intrinsic.aran.unary('typeof', variable)",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupExpression(true, BASE, "variable", makeDiscard()),
    `intrinsic.aran.throw(new intrinsic.TypeError("Cannot discard variable 'variable' because it is static"))`,
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupExpression(false, BASE, "variable", makeDiscard()),
    "false",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupExpression(
      false,
      BASE,
      "variable",
      makeWrite(makeLiteralExpression("right")),
    ),
    "(variable = 'right', undefined)",
  ),
);

assertSuccess(
  allignEffect(
    makeStaticLookupEffect(false, BASE, "variable", makeRead()),
    "effect(variable)",
  ),
);

///////////////////////
// makeDynamicLookup //
///////////////////////

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      true,
      makeLiteralExpression("frame"),
      "variable",
      makeRead(),
    ),
    "intrinsic.aran.get('frame', 'variable')",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      true,
      makeLiteralExpression("frame"),
      "variable",
      makeTypeof(),
    ),
    "intrinsic.aran.unary('typeof', intrinsic.aran.get('frame', 'variable'))",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      true,
      makeLiteralExpression("frame"),
      "variable",
      makeDiscard(),
    ),
    "intrinsic.aran.deleteStrict('frame', 'variable')",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      false,
      makeLiteralExpression("frame"),
      "variable",
      makeWrite(makeLiteralExpression("right")),
    ),
    "intrinsic.aran.setSloppy('frame', 'variable', 'right')",
  ),
);

///////////
// Other //
///////////

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
