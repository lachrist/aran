import {assertSuccess} from "../../../__fixture__.mjs";

import {makeLiteralExpression} from "../../../ast/index.mjs";

import {allignExpression} from "../../../allign/index.mjs";

import {makeRead, makeTypeof, makeDiscard, makeWrite} from "../right.mjs";

import {makeDynamicLookupExpression} from "./helper.mjs";

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
