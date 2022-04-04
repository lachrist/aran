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
  makePropertyScope,
  makeRootScope,
  makeClosureScope,
  makeWildcardScope,
  makeScopeBlock,
  lookupScopeProperty,
  isWildcardBound,
  // isBound,
  isNotBound,
  getBindingRoot,
  getBindingWildcard,
  declareStaticVariable,
  declareFreshStaticVariable,
  makeStaticInitializeEffect,
  makeLookupExpression,
  makeScopeEvalExpression,
} from "./core.mjs";

const KIND1 = 2;
const KIND2 = 3;
const KINDS = KIND1 * KIND2;

const callbacks = {
  onRoot: generateAssertUnreachable("onRoot"),
  onLiveHit: generateAssertUnreachable("onStaticLiveHit"),
  onDeadHit: generateAssertUnreachable("onStaticDeadHit"),
  onWildcard: generateAssertUnreachable("onWildcard"),
};

//////////////
// Property //
//////////////

assertThrow(() => lookupScopeProperty(makeRootScope("root"), "key"));

assertEqual(
  lookupScopeProperty(
    makeClosureScope(makePropertyScope(makeRootScope("root"), "key", "value")),
    "key",
  ),
  "value",
);

///////////
// Query //
///////////

{
  const scope = makeRootScope("root");
  assertEqual(isWildcardBound(scope, KIND1), false);
  assertEqual(isNotBound(scope, KIND1), true);
  assertEqual(getBindingRoot(scope, KIND1), "root");
}

{
  const scope = makeWildcardScope(makeRootScope("root"), KIND1, "wildcard");
  assertEqual(isWildcardBound(scope, KIND1), true);
  assertEqual(isNotBound(scope, KIND1), false);
  assertEqual(getBindingWildcard(scope, KIND1), "wildcard");
}

/////////////
// Regular //
/////////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope("root"), KINDS, [], (scope) => {
      scope = makePropertyScope(scope, "key", "value");
      assertEqual(
        declareFreshStaticVariable(scope, KIND1, "variable", "note"),
        "variable_1_1",
      );
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(
              makeClosureScope(scope),
              KIND1,
              "variable_1_1",
              {
                ...callbacks,
                onLiveHit: (read, _write, note) => {
                  assertEqual(note, "note");
                  return read();
                },
                onDeadHit: () => makeLiteralExpression("dead"),
              },
            ),
          ),
        ),
        makeEffectStatement(
          makeStaticInitializeEffect(
            scope,
            KIND1,
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
    makeScopeBlock(makeRootScope("root"), KINDS, [], (scope1) => {
      assertEqual(
        declareStaticVariable(scope1, KIND1, "variable", "note"),
        "variable",
      );
      return [
        makeBlockStatement(
          makeScopeBlock(scope1, KIND2, [], (scope2) => [
            makeEffectStatement(
              makeStaticInitializeEffect(
                scope2,
                KIND1,
                "variable",
                makeLiteralExpression("init"),
              ),
            ),
          ]),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(makeClosureScope(scope1), KIND1, "variable", {
              ...callbacks,
              onLiveHit: (read, _write, note) => {
                assertEqual(note, "note");
                return read();
              },
              onDeadHit: () => makeLiteralExpression("dead"),
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
    makeLookupExpression(makeRootScope("root"), KIND1, "variable", {
      ...callbacks,
      onRoot: (root) => {
        assertEqual(root, "root");
        return makeLiteralExpression("miss");
      },
    }),
    "'miss'",
  ),
  null,
);

///////////////////
// Dynamic Frame //
///////////////////

assertEqual(
  allignExpression(
    makeLookupExpression(
      makeWildcardScope(makeRootScope("root"), KINDS, "wildcard"),
      KIND1,
      "variable",
      {
        ...callbacks,
        onRoot: (root) => makeLiteralExpression(root),
        onWildcard: (wildcard, expression) =>
          makeSequenceExpression(
            makeExpressionEffect(makeLiteralExpression(wildcard)),
            expression,
          ),
      },
    ),
    "(effect('wildcard'), 'root')",
  ),
  null,
);

//////////
// Eval //
//////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope("root"), KINDS, [], (scope) => {
      assertEqual(
        declareStaticVariable(scope, KIND1, "variable", "note"),
        "variable",
      );
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
          makeStaticInitializeEffect(
            scope,
            KIND1,
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
