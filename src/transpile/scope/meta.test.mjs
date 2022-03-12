import {assertEqual, assertThrow} from "../../__fixture__.mjs";

import {makeCurry, getLatestUUID} from "../../util.mjs";

import {
  makeSequenceExpression,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignExpression, allignBlock} from "../../allign/index.mjs";

import {
  makeRootScope,
  makeDynamicScope,
  makeScopeBlock,
  makeTestBox,
  makePrimitiveBox,
  makeIntrinsicBox,
  makeBoxExpression,
  makeBoxStatementArray,
  makeCloseEffect,
  makeOpenExpression,
} from "./meta.mjs";

////////////
// Static //
////////////

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

/////////////
// Dynamic //
/////////////

{
  const scope = makeDynamicScope(
    makeRootScope(),
    makePrimitiveBox("frame"),
    "data",
  );
  assertEqual(
    allignExpression(
      makeBoxExpression(
        scope,
        "variable",
        makeLiteralExpression("init"),
        makeCurry((box) =>
          makeSequenceExpression(
            makeCloseEffect(scope, box, makeLiteralExpression("right")),
            makeOpenExpression(scope, box),
          ),
        ),
      ),
      `
        (
          effect(intrinsic('aran.setStrict')(
            undefined,
            'frame',
            'variable_${getLatestUUID()}',
            'init',
          )),
          (
            effect(intrinsic('aran.setStrict')(
              undefined,
              'frame',
              'variable_${getLatestUUID()}',
              'right',
            )),
            intrinsic('aran.get')(
              undefined,
              'frame',
              'variable_${getLatestUUID()}',
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
