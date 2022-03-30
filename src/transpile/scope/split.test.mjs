import {assertEqual} from "../../__fixture__.mjs";

import {makeLiteralExpression, makeEffectStatement} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  makeEmptyScopeBlock,
  makeRigidBaseDynamicScope,
  makeRootScope,
  declareRigidBaseVariable,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaLookupEffect,
} from "./split.mjs";

assertEqual(
  allignBlock(
    makeEmptyScopeBlock(makeRootScope(), [], (scope) => {
      const variable1 = declareMetaVariable(scope, "variable", "note");
      return [
        makeEffectStatement(
          makeMetaInitializeEffect(scope, variable1, {
            __proto__: null,
            onHit: (write, note) => {
              assertEqual(note, "note");
              return write(makeLiteralExpression("init"));
            },
          }),
        ),
        makeEffectStatement(
          makeMetaLookupEffect(scope, variable1, {
            __proto__: null,
            onLiveHit: (_read, write, note) => {
              assertEqual(note, "note");
              return write(makeLiteralExpression("right"));
            },
          }),
        ),
      ];
    }),
    "{ let x; x = 'init'; x = 'right'; }",
  ),
  null,
);

assertEqual(
  declareRigidBaseVariable(
    makeRigidBaseDynamicScope(makeRootScope(), 123),
    "variable",
    "note",
  ),
  123,
);
