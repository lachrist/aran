import "../../__fixture__.mjs";

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

import {
  makeRootScope,
  makeEmptyScopeBlock,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaReadExpression,
  makeMetaWriteEffect,
} from "./meta.mjs";

//////////
// root //
//////////

{
  const scope = makeRootScope("base");
  const variable = declareMetaVariable(scope, "variable");
  allignEffect(
    makeMetaInitializeEffect(scope, variable, makeLiteralExpression("init")),
    `effect(
      intrinsic('aran.setStrict')(
        intrinsic('aran.globalCache'),
        '${variable}',
        'init',
      ),
    )`,
  );
  allignExpression(
    makeMetaReadExpression(scope, variable),
    `intrinsic('aran.get')(
      intrinsic('aran.globalCache'),
      '${variable}',
    )`,
  );
  allignEffect(
    makeMetaWriteEffect(scope, variable, makeLiteralExpression("right")),
    `effect(
      intrinsic('aran.setStrict')(
        intrinsic('aran.globalCache'),
        '${variable}',
        'right',
      ),
    )`,
  );
}

///////////
// block //
///////////

allignBlock(
  makeEmptyScopeBlock(makeRootScope("base"), [], (scope) => {
    const variable = declareMetaVariable(scope, "variable");
    return [
      makeEffectStatement(
        makeMetaInitializeEffect(
          scope,
          variable,
          makeLiteralExpression("init"),
        ),
      ),
      makeEffectStatement(
        makeExpressionEffect(makeMetaReadExpression(scope, variable)),
      ),
      makeEffectStatement(
        makeMetaWriteEffect(scope, variable, makeLiteralExpression("right")),
      ),
    ];
  }),
  "{ let x; x = 'init'; effect(x); x = 'right'; }",
);
