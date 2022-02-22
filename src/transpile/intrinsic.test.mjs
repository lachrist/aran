import {assertEqual} from "../__fixture__.mjs";
import {makeLiteralExpression} from "../ast/index.mjs";
import {allignExpression} from "../allign/index.mjs";

import {
  makeThrowExpression,
  makeGetExpression,
  makeStrictSetExpression,
  makeObjectExpression,
  makeUnaryExpression,
  makeBinaryExpression,
  makeSyntaxErrorExpression,
} from "./intrinsic.mjs";

const test = (expression, code) => {
  assertEqual(allignExpression(expression, code), null);
};

test(
  makeThrowExpression(makeLiteralExpression(123)),
  "intrinsic('aran.throw')(undefined, 123)",
);

test(
  makeGetExpression(makeLiteralExpression(123), makeLiteralExpression(456)),
  "intrinsic('aran.get')(undefined, 123, 456)",
);

test(
  makeStrictSetExpression(
    makeLiteralExpression(123),
    makeLiteralExpression(456),
    makeLiteralExpression(789),
  ),
  "intrinsic('aran.setStrict')(undefined, 123, 456, 789)",
);

test(
  makeObjectExpression(makeLiteralExpression(123), makeLiteralExpression(456)),
  "intrinsic('aran.createObject')(undefined, 123, 456)",
);

test(
  makeObjectExpression(
    makeLiteralExpression(123),
    makeLiteralExpression(456),
    "annotation",
  ),
  "intrinsic('aran.createObject')(undefined, 123, 456)",
);

test(
  makeUnaryExpression("!", makeLiteralExpression(123)),
  "intrinsic('aran.unary')(undefined, '!', 123)",
);

test(
  makeBinaryExpression(
    "+",
    makeLiteralExpression(123),
    makeLiteralExpression(456),
  ),
  "intrinsic('aran.binary')(undefined, '+', 123, 456)",
);

test(
  makeSyntaxErrorExpression(makeLiteralExpression(123)),
  "new (intrinsic('SyntaxError'))(123)",
);
