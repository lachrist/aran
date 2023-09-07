import { assertSuccess } from "../fixture.mjs";

import { makeLiteralExpression } from "../../lib/syntax.mjs";

import { allignExpression } from "./allign/index.mjs";

import {
  makeObjectFreezeExpression,
  makeDeleteExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
  makeThrowSyntaxErrorExpression,
  makeJsonExpression,
  makeIsNullishExpression,
} from "../../lib/intrinsic.mjs";

const test = (expression, code) => {
  assertSuccess(allignExpression(expression, code));
};

for (const strict of [true, false]) {
  test(
    makeDeleteExpression(
      strict,
      makeLiteralExpression(123),
      makeLiteralExpression(456),
    ),
    `intrinsic.aran.delete${strict ? "Strict" : "Sloppy"}(123, 456)`,
  );
}

for (const strict of [true, false]) {
  test(
    makeSetExpression(
      strict,
      makeLiteralExpression(123),
      makeLiteralExpression(456),
      makeLiteralExpression(789),
    ),
    `intrinsic.aran.set${strict ? "Strict" : "Sloppy"}(123, 456, 789)`,
  );
}

test(
  makeDataDescriptorExpression(
    makeLiteralExpression(123),
    makeLiteralExpression(456),
    null,
    null,
  ),
  "intrinsic.aran.createObject(null, 'value', 123, 'writable', 456)",
);

test(
  makeThrowSyntaxErrorExpression("message"),
  "intrinsic.aran.throw(new intrinsic.SyntaxError('message'))",
);

test(makeJsonExpression(null), "null");

test(makeJsonExpression([1, 2, 3]), "intrinsic.Array.of(1, 2, 3)");

test(
  makeJsonExpression({ foo: "bar" }),
  "intrinsic.aran.createObject(null, 'foo', 'bar')",
);

test(
  makeObjectFreezeExpression(makeLiteralExpression(123)),
  "intrinsic.Object.freeze(123)",
);

test(
  makeIsNullishExpression(makeLiteralExpression(123)),
  `
    (
      intrinsic.aran.binary("===", 123, null) ?
      true :
      intrinsic.aran.binary("===", 123, undefined)
    )
  `,
);
