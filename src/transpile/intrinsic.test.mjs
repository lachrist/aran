import {assertEqual} from "../__fixture__.mjs";
import {makeLiteralExpression} from "../ast/index.mjs";
import {allignExpression} from "../allign/index.mjs";

import {
  makeTypeofGlobalExpression,
  makeGetExpression,
  makeHasExpression,
  makeSetExpression,
  makeDeleteExpression,
  makeObjectExpression,
  makeSimpleObjectExpression,
  makeUnaryExpression,
  makeBinaryExpression,
  makeThrowSyntaxErrorExpression,
  makeDirectIntrinsicExpression,
} from "./intrinsic.mjs";

const test = (expression, code) => {
  assertEqual(allignExpression(expression, code), null);
};

test(
  makeHasExpression(
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic('aran.has')(undefined, 'object', 'key')",
);

test(
  makeTypeofGlobalExpression(makeLiteralExpression("variable")),
  "intrinsic('aran.typeofGlobal')(undefined, 'variable')",
);

test(
  makeGetExpression(
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic('aran.get')(undefined, 'object', 'key')",
);

test(
  makeSetExpression(
    true,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
    makeLiteralExpression("value"),
  ),
  "intrinsic('aran.setStrict')(undefined, 'object', 'key', 'value')",
);

test(
  makeSetExpression(
    false,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
    makeLiteralExpression("value"),
  ),
  "intrinsic('aran.setSloppy')(undefined, 'object', 'key', 'value')",
);

test(
  makeDeleteExpression(
    true,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic('aran.deleteStrict')(undefined, 'object', 'key')",
);

test(
  makeDeleteExpression(
    false,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic('aran.deleteSloppy')(undefined, 'object', 'key')",
);

test(
  makeObjectExpression(makeLiteralExpression("prototype"), [
    [makeLiteralExpression("key"), makeLiteralExpression("value")],
  ]),
  "intrinsic('aran.createObject')(undefined, 'prototype', 'key', 'value')",
);

test(
  makeObjectExpression(makeLiteralExpression("prototype"), [], "annotation"),
  "intrinsic('aran.createObject')(undefined, 'prototype')",
);

test(
  makeSimpleObjectExpression(
    makeLiteralExpression("prototype"),
    {key: makeLiteralExpression("value")},
    "annotation",
  ),
  "intrinsic('aran.createObject')(undefined, 'prototype', 'key', 'value')",
);

test(
  makeUnaryExpression("!", makeLiteralExpression("argument")),
  "intrinsic('aran.unary')(undefined, '!', 'argument')",
);

test(
  makeBinaryExpression(
    "+",
    makeLiteralExpression("left"),
    makeLiteralExpression("right"),
  ),
  "intrinsic('aran.binary')(undefined, '+', 'left', 'right')",
);

test(
  makeThrowSyntaxErrorExpression("message"),
  "intrinsic('aran.throw')(undefined, new (intrinsic('SyntaxError'))('message'))",
);

test(makeDirectIntrinsicExpression("globalThis"), "intrinsic('globalThis')");
