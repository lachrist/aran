import { forEach } from "array-lite";

import { assertSuccess } from "./__fixture__.mjs";

import { makeLiteralExpression } from "./ast/index.mjs";

import { allignExpression } from "./allign/index.mjs";

import {
  // makeReadGlobalExpression,
  // makeDiscardGlobalExpression,
  makeObjectFreezeExpression,
  makeDeleteExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
  makeThrowSyntaxErrorExpression,
  makeJSONExpression,
} from "./intrinsic.mjs";

const test = (expression, code) => {
  assertSuccess(allignExpression(expression, code));
};

// test(
//   makeReadGlobalExpression("variable"),
//   "intrinsic.aran.readGlobal('variable')",
// );
//
// test(
//   makeDiscardGlobalExpression(false, "variable"),
//   "intrinsic.aran.discardGlobalSloppy('variable')",
// );

forEach([true, false], (strict) => {
  test(
    makeDeleteExpression(
      strict,
      makeLiteralExpression(123),
      makeLiteralExpression(456),
    ),
    `intrinsic.aran.delete${strict ? "Strict" : "Sloppy"}(123, 456)`,
  );
});

forEach([true, false], (strict) => {
  test(
    makeSetExpression(
      strict,
      makeLiteralExpression(123),
      makeLiteralExpression(456),
      makeLiteralExpression(789),
    ),
    `intrinsic.aran.set${strict ? "Strict" : "Sloppy"}(123, 456, 789)`,
  );
});

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

test(makeJSONExpression(null), "null");

test(makeJSONExpression([1, 2, 3]), "intrinsic.Array.of(1, 2, 3)");

test(
  makeJSONExpression({ foo: "bar" }),
  "intrinsic.aran.createObject(null, 'foo', 'bar')",
);

test(
  makeObjectFreezeExpression(makeLiteralExpression(123)),
  "intrinsic.Object.freeze(123)",
);
