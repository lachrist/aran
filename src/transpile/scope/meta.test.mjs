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

////////////
// Static //
////////////

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

//////////////////////
// Dynanmic && Miss //
//////////////////////

{
  const scope = makeMetaDynamicScope(
    makeRootScope(),
    makeLiteralExpression("frame"),
  );
  const variable = declareMetaVariable(scope, "variable");
  allignEffect(
    makeMetaInitializeEffect(scope, variable, makeLiteralExpression("init")),
    `
      intrinsic('aran.binary')(undefined, 'in', 'frame', ${variable})
        ? effect(intrinsic('aran.throw')(new (intrinsic('aran.AranError'))('duplicate initialization of dynamic compilation variable')))
        : effect(intrinsic('aran.setStrict')(undefined, 'frame', '${variable}', 'init'))
    `,
  );
  allignExpression(
    makeMetaReadExpression(scope, variable),
    `
      intrinsic('aran.binary')(undefined, 'in', 'frame', ${variable})
        ? intrinsic('aran.get')(undefined, 'frame', '${variable}')
        : intrinsic('aran.throw')(new (intrinsic('aran.AranError'))('missing dynamic compilation variable for reading'))
    `,
  );
  allignEffect(
    makeMetaWriteEffect(scope, variable, makeLiteralExpression("right")),
    `
      intrinsic('aran.binary')(undefined, 'in', 'frame', ${variable})
        ? effect(intrinsic('aran.setStrict')(undefined, 'frame', '${variable}', 'right'))
        : effect(intrinsic('aran.throw')(new (intrinsic('aran.AranError'))('missing dynamic compilation variable for writing')))
    `,
  );
}
