import {assertSuccess} from "../../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {
  allignExpression,
  allignEffect,
  allignBlock,
} from "../../allign/index.mjs";

import {makeRootScope, makeScopeBlock} from "./split.mjs";

import {
  initializeScope,
  backupScope,
  restoreScope,
  declareVariable,
  makeInitializeEffect,
  makeReadExpression,
  makeWriteEffect,
} from "./meta.mjs";

//////////
// root //
//////////

{
  const scope = initializeScope(makeRootScope());
  restoreScope(scope, backupScope(scope) + 1);
  const variable = declareVariable(scope, "variable");
  assertSuccess(
    allignEffect(
      makeInitializeEffect(scope, variable, makeLiteralExpression("init")),
      `effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.globalCache,
          '${variable}',
          'init',
        ),
      )`,
    ),
  );
  assertSuccess(
    allignExpression(
      makeReadExpression(scope, variable),
      `intrinsic.aran.get(
        intrinsic.aran.globalCache,
        '${variable}',
      )`,
    ),
  );
  assertSuccess(
    allignEffect(
      makeWriteEffect(scope, variable, makeLiteralExpression("right")),
      `effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.globalCache,
          '${variable}',
          'right',
        ),
      )`,
    ),
  );
}

///////////
// block //
///////////

assertSuccess(
  allignBlock(
    makeScopeBlock(initializeScope(makeRootScope()), [], (scope) => {
      const variable = declareVariable(scope, "variable");
      return [
        makeEffectStatement(
          makeInitializeEffect(scope, variable, makeLiteralExpression("init")),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeReadExpression(scope, variable)),
        ),
        makeEffectStatement(
          makeWriteEffect(scope, variable, makeLiteralExpression("right")),
        ),
      ];
    }),
    "{ let x; x = 'init'; effect(x); x = 'right'; }",
  ),
);
