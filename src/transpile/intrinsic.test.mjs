import {assertSuccess} from "../__fixture__.mjs";
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
  assertSuccess(allignExpression(expression, code));
};

test(
  makeHasExpression(
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic.aran.has('object', 'key')",
);

test(
  makeTypeofGlobalExpression(makeLiteralExpression("variable")),
  "intrinsic.aran.typeofGlobal('variable')",
);

test(
  makeGetExpression(
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic.aran.get('object', 'key')",
);

test(
  makeSetExpression(
    true,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
    makeLiteralExpression("value"),
  ),
  "intrinsic.aran.setStrict('object', 'key', 'value')",
);

test(
  makeSetExpression(
    false,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
    makeLiteralExpression("value"),
  ),
  "intrinsic.aran.setSloppy('object', 'key', 'value')",
);

test(
  makeDeleteExpression(
    true,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic.aran.deleteStrict('object', 'key')",
);

test(
  makeDeleteExpression(
    false,
    makeLiteralExpression("object"),
    makeLiteralExpression("key"),
  ),
  "intrinsic.aran.deleteSloppy('object', 'key')",
);

test(
  makeObjectExpression(makeLiteralExpression("prototype"), [
    [makeLiteralExpression("key"), makeLiteralExpression("value")],
  ]),
  "intrinsic.aran.createObject('prototype', 'key', 'value')",
);

test(
  makeObjectExpression(makeLiteralExpression("prototype"), [], "annotation"),
  "intrinsic.aran.createObject('prototype')",
);

test(
  makeSimpleObjectExpression(
    makeLiteralExpression("prototype"),
    {key: makeLiteralExpression("value")},
    "annotation",
  ),
  "intrinsic.aran.createObject('prototype', 'key', 'value')",
);

test(
  makeUnaryExpression("!", makeLiteralExpression("argument")),
  "intrinsic.aran.unary('!', 'argument')",
);

test(
  makeBinaryExpression(
    "+",
    makeLiteralExpression("left"),
    makeLiteralExpression("right"),
  ),
  "intrinsic.aran.binary('+', 'left', 'right')",
);

test(
  makeThrowSyntaxErrorExpression("message"),
  "intrinsic.aran.throw(new intrinsic.SyntaxError('message'))",
);

test(makeDirectIntrinsicExpression("globalThis"), "intrinsic.globalThis");
