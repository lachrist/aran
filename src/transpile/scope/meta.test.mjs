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
  makeMetaDynamicScope,
  makeEmptyScopeBlock,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaReadExpression,
  makeMetaWriteEffect,
} from "./meta.mjs";

//////////
// Miss //
//////////

{
  const scope = makeMetaDynamicScope(
    makeRootScope(),
    makeLiteralExpression("frame"),
  );
  const variable = declareMetaVariable(scope, "variable");
  allignEffect(
    makeMetaInitializeEffect(scope, variable, makeLiteralExpression("init")),
    `effect(intrinsic('aran.setStrict')(undefined, 'frame', '${variable}', 'init'))`,
  );
  allignExpression(
    makeMetaReadExpression(scope, variable),
    `intrinsic('aran.get')(undefined, 'frame', '${variable}')`,
  );
  allignEffect(
    makeMetaWriteEffect(scope, variable, makeLiteralExpression("right")),
    `effect(intrinsic('aran.setStrict')(undefined, 'frame', '${variable}', 'right'))`,
  );
}

/////////
// Hit //
/////////

allignBlock(
  makeEmptyScopeBlock(makeRootScope(), [], (scope) => {
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
