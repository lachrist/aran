import {
  assertEqual,
  assertThrow,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  READ,
  makeBaseDynamicScope,
  isMetaBound,
  makeRootScope,
  makeScopeBlock,
  makeMetaPropertyScope,
  lookupMetaScopeProperty,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaLookupExpression,
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
          makeExpressionEffect(
            makeMetaLookupExpression(
              makeBaseDynamicScope(scope, "frame"),
              variable,
              READ,
              {
                __proto__: null,
                onDeadHit: generateAssertUnreachable("onDeadHit"),
                onLiveHit: (node, note) => {
                  assertEqual(note, "note");
                  return node;
                },
                onRoot: generateAssertUnreachable("onRoot"),
              },
            ),
          ),
        ),
      ];
    }),
    "{ let x; x = 'init'; effect(x); }",
  ),
  null,
);
