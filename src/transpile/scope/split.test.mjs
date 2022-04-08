import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";

import {makeLiteralExpression, makeEffectStatement} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  makeRootScope,
  getMetaRoot,
  setMetaRoot,
  makeEmptyScopeBlock,
  declareMetaFreshVariable,
  makeMetaInitializeEffect,
  makeMetaLookupEffect,
} from "./split.mjs";

const {undefined} = globalThis;

{
  const scope = makeRootScope("meta", "base");
  assertEqual(getMetaRoot(scope), "meta");
  assertEqual(setMetaRoot(scope, "META"), undefined);
  assertEqual(getMetaRoot(scope), "META");
}

assertEqual(
  allignBlock(
    makeEmptyScopeBlock(makeRootScope("meta", "base"), [], (scope) => {
      const variable = declareMetaFreshVariable(scope, "variable", "note");
      return [
        makeEffectStatement(
          makeMetaInitializeEffect(
            scope,
            variable,
            makeLiteralExpression("init"),
          ),
        ),
        makeEffectStatement(
          makeMetaLookupEffect(scope, variable, {
            __proto__: null,
            onWildcard: generateAssertUnreachable("onWildcard"),
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
