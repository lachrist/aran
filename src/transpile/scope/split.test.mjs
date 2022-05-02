import {
  assertEqual,
  assertThrow,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";

import {makeLiteralExpression, makeEffectStatement} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  makeBaseDynamicScope,
  isMetaBound,
  makeRootScope,
  makeScopeBlock,
  makeMetaPropertyScope,
  lookupMetaScopeProperty,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaLookupEffect,
} from "./split.mjs";

assertEqual(isMetaBound(makeRootScope()), false);

assertThrow(() => isMetaBound(makeBaseDynamicScope(makeRootScope()), "frame"));

assertEqual(
  lookupMetaScopeProperty(
    makeMetaPropertyScope(makeRootScope(), "key", "value"),
    "key",
  ),
  "value",
);

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), [], (scope) => {
      assertEqual(isMetaBound(scope), true);
      const variable = declareMetaVariable(scope, "variable", "note");
      return [
        makeEffectStatement(
          makeMetaInitializeEffect(
            scope,
            variable,
            makeLiteralExpression("init"),
          ),
        ),
        makeEffectStatement(
          makeMetaLookupEffect(makeBaseDynamicScope(scope, "frame"), variable, {
            __proto__: null,
            onDeadHit: generateAssertUnreachable("onDeadHit"),
            onLiveHit: (_read, write, note) =>
              write(makeLiteralExpression(note)),
            onRoot: generateAssertUnreachable("onRoot"),
          }),
        ),
      ];
    }),
    "{ let x; x = 'init'; x = 'note'; }",
  ),
  null,
);
