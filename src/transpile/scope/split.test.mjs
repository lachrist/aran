import {assertEqual} from "../../__fixture__.mjs";
import {makeCurry} from "../../util.mjs";
import {
  makeLiteralExpression,
  makeEffectStatement,
  makeWriteEffect,
} from "../../ast/index.mjs";
import {allignBlock} from "../../allign/index.mjs";
import {
  makeEmptyScopeBlock,
  makeEmptyDynamicScope,
  makeRootScope,
  declareMetaVariable,
  makeMetaInitializeEffect,
  makeMetaLookupEffect,
} from "./split.mjs";

assertEqual(
  allignBlock(
    makeEmptyScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) => {
        const variable1 = declareMetaVariable(scope, "variable", "note");
        return [
          makeEffectStatement(
            makeMetaInitializeEffect(scope, variable1, {
              __proto__: null,
              onDeadHit: makeCurry((variable2) =>
                makeWriteEffect(variable2, makeLiteralExpression("init")),
              ),
            }),
          ),
          makeEffectStatement(
            makeMetaLookupEffect(scope, variable1, {
              __proto__: null,
              onLiveHit: makeCurry((variable2, note) => {
                assertEqual(note, "note");
                return makeWriteEffect(
                  variable2,
                  makeLiteralExpression("right"),
                );
              }),
            }),
          ),
        ];
      }),
    ),
    "{ let x; x = 'init'; x = 'right'; }",
  ),
  null,
);

assertEqual(
  declareMetaVariable(
    makeEmptyDynamicScope(makeRootScope(), 123),
    "variable",
    "note",
  ),
  123,
);
