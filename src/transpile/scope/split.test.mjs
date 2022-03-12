import {assertEqual} from "../../__fixture__.mjs";
import {makeCurry} from "../../util.mjs";
import {
  makeLiteralExpression,
  makeEffectStatement,
  makeWriteEffect,
} from "../../ast/index.mjs";
import {allignBlock} from "../../allign/index.mjs";
import {
  makeScopeBlock,
  makeDynamicScope,
  makeRootScope,
  declareMetaVariable,
  makeMetaInitializeEffect,
} from "./split.mjs";

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) => [
        makeEffectStatement(
          makeMetaInitializeEffect(
            scope,
            declareMetaVariable(scope, "variable"),
            {
              __proto__: null,
              onDeadHit: makeCurry((variable) =>
                makeWriteEffect(variable, makeLiteralExpression("init")),
              ),
            },
          ),
        ),
      ]),
    ),
    "{ let x; x = 'init'; }",
  ),
  null,
);

assertEqual(
  declareMetaVariable(makeDynamicScope(makeRootScope(), 123), "variable"),
  123,
);
