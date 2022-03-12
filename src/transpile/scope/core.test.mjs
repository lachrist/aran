import {
  assertThrow,
  assertEqual,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";
import {makeCurry} from "../../util.mjs";
import {
  makeEffectStatement,
  makeWriteEffect,
  makeReadExpression,
  makeLiteralExpression,
  makeBlockStatement,
  makeSequenceExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import {
  allignBlock,
  allignExpression,
  allignEffect,
} from "../../allign/index.mjs";

import {
  makePropertyScope,
  makeRootScope,
  makeClosureScope,
  makeDynamicScope,
  makeScopeBlock,
  annotateVariable,
  lookupScopeProperty,
  declareVariable,
  declareFreshVariable,
  makeInitializeEffect,
  makeLookupExpression,
  makeScopeEvalExpression,
} from "./core.mjs";

const curries = {
  onMiss: makeCurry(generateAssertUnreachable("onMiss")),
  onGhostHit: makeCurry(generateAssertUnreachable("onGhostHit")),
  onLiveHit: makeCurry(generateAssertUnreachable("onStaticLiveHit")),
  onDeadHit: makeCurry(generateAssertUnreachable("onStaticDeadHit")),
  onDynamicFrame: makeCurry(generateAssertUnreachable("onDynamicFrame")),
};

assertThrow(() =>
  declareVariable(makeClosureScope(makeRootScope()), "variable"),
);

//////////////
// Property //
//////////////

assertThrow(() => lookupScopeProperty(makeRootScope(), "key"));

assertEqual(
  lookupScopeProperty(
    makeClosureScope(makePropertyScope(makeRootScope(), "key", "value")),
    "key",
  ),
  "value",
);

/////////////
// Regular //
/////////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) => {
        scope = makePropertyScope(scope, "key", "value");
        assertEqual(declareFreshVariable(scope, "variable"), "variable_1_1");
        annotateVariable(scope, "variable_1_1", "note");
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeLookupExpression(makeClosureScope(scope), "variable_1_1", {
                ...curries,
                onLiveHit: makeCurry((variable, note) => {
                  assertEqual(note, "note");
                  return makeReadExpression(variable);
                }),
                onDeadHit: makeCurry(() => makeLiteralExpression("dead")),
              }),
            ),
          ),
          makeEffectStatement(
            makeInitializeEffect(scope, "variable_1_1", {
              onDeadHit: makeCurry((variable) =>
                makeWriteEffect(variable, makeLiteralExpression("init")),
              ),
            }),
          ),
        ];
      }),
    ),
    `
      {
        let x, _x;
        _x = false;
        effect(_x ? x : 'dead');
        (x = 'init', _x = true);
      }
    `,
  ),
  null,
);

////////////////////////////
// Distant Initialization //
////////////////////////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope1) => {
        assertEqual(declareVariable(scope1, "variable"), "variable");
        return [
          makeBlockStatement(
            makeScopeBlock(
              scope1,
              [],
              makeCurry((scope2) => [
                makeEffectStatement(
                  makeInitializeEffect(scope2, "variable", {
                    ...curries,
                    onDeadHit: makeCurry((variable) =>
                      makeWriteEffect(variable, makeLiteralExpression("init")),
                    ),
                  }),
                ),
              ]),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeLookupExpression(makeClosureScope(scope1), "variable", {
                ...curries,
                onLiveHit: makeCurry((variable, note) => {
                  assertEqual(note, null);
                  return makeReadExpression(variable);
                }),
                onDeadHit: makeCurry(() => makeLiteralExpression("dead")),
              }),
            ),
          ),
        ];
      }),
    ),
    `
      {
        let x, _x;
        _x = false;
        {
          (x = 'init', _x = true);
        }
        effect(_x ? x : 'dead');
      }
    `,
  ),
  null,
);

//////////
// Miss //
//////////

assertEqual(
  allignEffect(
    makeInitializeEffect(makeRootScope(), "variable", {
      ...curries,
      onMiss: makeCurry(() =>
        makeExpressionEffect(makeLiteralExpression("miss")),
      ),
    }),
    "effect('miss')",
  ),
  null,
);

assertEqual(
  allignExpression(
    makeLookupExpression(makeRootScope(), "variable", {
      ...curries,
      onMiss: makeCurry(() => makeLiteralExpression("miss")),
    }),
    "'miss'",
  ),
  null,
);

///////////////////
// Dynamic Frame //
///////////////////

assertEqual(
  declareVariable(makeDynamicScope(makeRootScope(), "frame"), "variable"),
  "frame",
);

assertEqual(
  allignEffect(
    makeInitializeEffect(
      makeDynamicScope(makeRootScope(), "frame"),
      "variable",
      {
        ...curries,
        onDynamicFrame: makeCurry((frame) =>
          makeExpressionEffect(makeLiteralExpression(frame)),
        ),
      },
    ),
    `effect('frame')`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeLookupExpression(
      makeDynamicScope(makeRootScope(), "frame"),
      "variable",
      {
        ...curries,
        onMiss: makeCurry(() => makeLiteralExpression("miss")),
        onDynamicFrame: makeCurry((frame, expression) =>
          makeSequenceExpression(
            makeExpressionEffect(makeLiteralExpression(frame)),
            expression,
          ),
        ),
      },
    ),
    "(effect('frame'), 'miss')",
  ),
  null,
);

//////////
// Eval //
//////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) => {
        assertEqual(declareVariable(scope, "variable"), "variable");
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeEvalExpression(
                makeClosureScope(scope),
                makeLiteralExpression("eval"),
              ),
            ),
          ),
          makeEffectStatement(
            makeInitializeEffect(scope, "variable", {
              ...curries,
              onDeadHit: makeCurry((variable) =>
                makeWriteEffect(variable, makeLiteralExpression("init")),
              ),
            }),
          ),
        ];
      }),
    ),
    `
      {
        let x, _x;
        _x = false;
        effect(eval([x, _x], 'eval'));
        (x = 'init', _x = true);
      }
    `,
  ),
  null,
);
