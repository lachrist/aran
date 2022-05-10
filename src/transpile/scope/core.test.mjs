import {
  assertThrow,
  assertEqual,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeBlockStatement,
  makeSequenceExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignBlock, allignExpression} from "../../allign/index.mjs";

import {
  READ,
  makePropertyScope,
  makeRootScope,
  makeClosureScope,
  makeDynamicScope,
  makeScopeBlock,
  lookupScopeProperty,
  isBound,
  isStaticallyBound,
  isDynamicallyBound,
  getBindingDynamicExtrinsic,
  declareVariable,
  declareFreshVariable,
  makeInitializeEffect,
  makeLookupExpression,
  makeScopeEvalExpression,
} from "./core.mjs";

const callbacks = {
  onStaticMiss: generateAssertUnreachable("onStaticMiss"),
  onStaticLiveHit: generateAssertUnreachable("onStaticLiveHit"),
  onStaticDeadHit: generateAssertUnreachable("onStaticDeadHit"),
  onDynamicExtrinsic: generateAssertUnreachable("onDynamicExtrinsic"),
};

//////////////
// Property //
//////////////

{
  let scope = makeRootScope();
  assertThrow(() => lookupScopeProperty(scope, "key"));
  scope = makePropertyScope(scope, "key", "value");
  scope = makeClosureScope(scope);
  assertEqual(lookupScopeProperty(scope, "key"), "value");
}

///////////
// Query //
///////////

{
  const scope1 = makeRootScope();
  assertEqual(isBound(scope1), false);
  assertEqual(isStaticallyBound(scope1), false);
  assertEqual(isDynamicallyBound(scope1), false);
  const scope2 = makeDynamicScope(scope1, "extrinsic");
  const scope3 = makePropertyScope(scope2, "key", "value");
  assertEqual(isBound(scope3), true);
  assertEqual(isStaticallyBound(scope3), false);
  assertEqual(isDynamicallyBound(scope3), true);
  assertEqual(getBindingDynamicExtrinsic(scope3), "extrinsic");
}

/////////////
// Regular //
/////////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), [], (scope) => {
      scope = makePropertyScope(scope, "key", "value");
      assertEqual(
        declareFreshVariable(scope, "variable", "note"),
        "variable_1_1",
      );
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(
              makeClosureScope(scope),
              "variable_1_1",
              READ,
              {
                ...callbacks,
                onStaticLiveHit: (node, note) => {
                  assertEqual(note, "note");
                  return node;
                },
                onStaticDeadHit: (note) => {
                  assertEqual(note, "note");
                  return makeLiteralExpression("dead");
                },
              },
            ),
          ),
        ),
        makeEffectStatement(
          makeInitializeEffect(
            scope,
            "variable_1_1",
            makeLiteralExpression("init"),
          ),
        ),
      ];
    }),
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
    makeScopeBlock(makeRootScope(), [], (scope1) => {
      assertEqual(declareVariable(scope1, "variable", "note"), "variable");
      return [
        makeBlockStatement(
          makeScopeBlock(scope1, [], (scope2) => [
            makeEffectStatement(
              makeInitializeEffect(
                scope2,
                "variable",
                makeLiteralExpression("init"),
              ),
            ),
          ]),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(makeClosureScope(scope1), "variable", READ, {
              ...callbacks,
              onStaticLiveHit: (node, note) => {
                assertEqual(note, "note");
                return node;
              },
              onStaticDeadHit: (note) => {
                assertEqual(note, "note");
                return makeLiteralExpression("dead");
              },
            }),
          ),
        ),
      ];
    }),
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
// Root //
//////////

assertEqual(
  allignExpression(
    makeLookupExpression(makeRootScope(), "variable", READ, {
      ...callbacks,
      onStaticMiss: () => makeLiteralExpression("root"),
    }),
    "'root'",
  ),
  null,
);

///////////////////
// Dynamic Frame //
///////////////////

assertEqual(
  allignExpression(
    makeLookupExpression(
      makeDynamicScope(makeRootScope(), "extrinsic"),
      "variable",
      READ,
      {
        ...callbacks,
        onStaticMiss: () => makeLiteralExpression("root"),
        onDynamicExtrinsic: (expression, extrinsic) =>
          makeSequenceExpression(
            makeExpressionEffect(makeLiteralExpression(extrinsic)),
            expression,
          ),
      },
    ),
    "(effect('extrinsic'), 'root')",
  ),
  null,
);

//////////
// Eval //
//////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), [], (scope) => {
      assertEqual(declareVariable(scope, "variable", "note"), "variable");
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
          makeInitializeEffect(
            scope,
            "variable",
            makeLiteralExpression("init"),
          ),
        ),
      ];
    }),
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
