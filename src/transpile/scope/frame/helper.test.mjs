import {assertSuccess, assertDeepEqual} from "../../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {
  allignEffect,
  allignStatement,
  allignExpression,
} from "../../../allign/index.mjs";

import {
  makeStaticLookupNode,
  makeDynamicLookupExpression,
  makeExportStatement,
  makeExportUndefinedStatement,
  makeExportSequenceEffect,
  makeThrowDuplicateExpression,
  makeThrowMissingExpression,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeThrowDiscardExpression,
} from "./helper.mjs";

const {Error} = globalThis;

////////////////////////////////
// makeStaticLookupExpression //
////////////////////////////////

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      (...args) => {
        assertDeepEqual(args, ["frame", "variable"]);
        return true;
      },
      (...args) => {
        assertDeepEqual(args, [true, false, "frame", "variable"]);
        return makeLiteralExpression("here");
      },
      () => {
        throw new Error("next");
      },
      true,
      false,
      "frame",
      "variable",
    ),
    "'here'",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      (...args) => {
        assertDeepEqual(args, ["frame", "variable"]);
        return false;
      },
      () => {
        throw new Error("here");
      },
      (...args) => {
        assertDeepEqual(args, []);
        return makeLiteralExpression("next");
      },
      true,
      false,
      "frame",
      "variable",
    ),
    "'next'",
  ),
);

////////////////////////////////
// makeDynamicLookupExpression //
////////////////////////////////

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      (...args) => {
        assertDeepEqual(args, ["frame", "variable"]);
        return true;
      },
      () => {
        throw new Error("test");
      },
      (...args) => {
        assertDeepEqual(args, [true, false, "frame", "variable"]);
        return makeLiteralExpression("here");
      },
      () => {
        throw new Error("next");
      },
      true,
      false,
      "frame",
      "variable",
    ),
    "'here'",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      (...args) => {
        assertDeepEqual(args, ["frame", "variable"]);
        return false;
      },
      (...args) => {
        assertDeepEqual(args, ["frame", "variable"]);
        return makeLiteralExpression("test");
      },
      (...args) => {
        assertDeepEqual(args, [true, false, "frame", "variable"]);
        return makeLiteralExpression("here");
      },
      (...args) => {
        assertDeepEqual(args, []);
        return makeLiteralExpression("next");
      },
      true,
      false,
      "frame",
      "variable",
    ),
    "('test' ? 'here' : 'next')",
  ),
);

////////////
// Export //
////////////

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

////////////
// Report //
////////////

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
    makeThrowDiscardExpression("variable"),
    `intrinsic.aran.throw(new intrinsic.TypeError("Cannot discard variable 'variable' because it is static"))`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowConstantExpression("variable"),
    `intrinsic.aran.throw(new intrinsic.TypeError("Cannot assign variable 'variable' because it is constant"))`,
  ),
);
