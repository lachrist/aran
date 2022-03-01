import {assertEqual, assertThrow} from "../../__fixture__.mjs";

import {makeCurry} from "../../util.mjs";

import {
  makeSequenceExpression,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignExpression, allignBlock} from "../../allign/index.mjs";

import {
  makeScopeBlock,
  makeRootScope,
  makeTestBox,
  makePrimitiveBox,
  makeIntrinsicBox,
  makeBoxExpression,
  makeBoxStatementArray,
  makeCloseEffect,
  makeOpenExpression,
  getLatestUUID,
} from "./meta.mjs";

///////////
// Local //
///////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) =>
        makeBoxStatementArray(
          scope,
          "variable",
          makeLiteralExpression(123),
          makeCurry((box) => [
            makeEffectStatement(
              makeExpressionEffect(makeOpenExpression(scope, box)),
            ),
            makeEffectStatement(
              makeCloseEffect(scope, box, makeLiteralExpression(456)),
            ),
          ]),
        ),
      ),
    ),
    "{ let x; x = 123; effect(x); x = 456; }",
  ),
  null,
);

////////////
// Global //
////////////

{
  const scope = makeRootScope();
  assertEqual(
    allignExpression(
      makeBoxExpression(
        scope,
        "variable",
        makeLiteralExpression(123),
        makeCurry((box) =>
          makeSequenceExpression(
            makeCloseEffect(scope, box, makeLiteralExpression(456)),
            makeOpenExpression(scope, box),
          ),
        ),
      ),
      `
        (
          effect(intrinsic('aran.setStrict')(
            undefined,
            intrinsic('aran.globalRecord'),
            'variable_1_${getLatestUUID()}',
            123,
          )),
          (
            effect(intrinsic('aran.setStrict')(
              undefined,
              intrinsic('aran.globalRecord'),
              'variable_1_${getLatestUUID()}',
              456,
            )),
            intrinsic('aran.get')(
              undefined,
              intrinsic('aran.globalRecord'),
              'variable_1_${getLatestUUID()}',
            )
          )
        )
      `,
    ),
    null,
  );
}

//////////
// Test //
//////////

{
  const scope = makeRootScope();
  const box = makeTestBox("variable");
  assertEqual(
    allignExpression(
      makeSequenceExpression(
        makeCloseEffect(scope, box, makeLiteralExpression(123)),
        makeOpenExpression(scope, box),
      ),
      "(x = 123, x)",
    ),
    null,
  );
}

///////////////
// Primitive //
///////////////

assertEqual(
  allignExpression(
    makeOpenExpression(makeRootScope(), makePrimitiveBox(123)),
    "123",
  ),
  null,
);

///////////////
// Intrinsic //
///////////////

assertEqual(
  allignExpression(
    makeOpenExpression(makeRootScope(), makeIntrinsicBox("SyntaxError")),
    "intrinsic('SyntaxError')",
  ),
  null,
);

/////////////
// Invalid //
/////////////

assertThrow(() =>
  makeOpenExpression(makeRootScope(), {type: "invalid", data: 123}),
);

assertThrow(() =>
  makeCloseEffect(
    makeRootScope(),
    makePrimitiveBox(123),
    makeLiteralExpression(456),
  ),
);
