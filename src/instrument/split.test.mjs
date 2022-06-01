import {assertEqual, assertSuccess} from "../__fixture__.mjs";

import {allignBlock} from "../allign/index.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../ast/index.mjs";

import {extendScope, createRootScope, makeScopeBlock} from "./scope.mjs";

import {
  VAR_SPLIT,
  declareSplitScope,
  lookupSplitScope,
  isSplitScopeUsed,
  makeSplitScopeReadExpression,
  makeSplitScopeWriteEffect,
} from "./split.mjs";

const {undefined} = globalThis;

{
  const scope = extendScope(createRootScope("secret_"));
  assertEqual(
    declareSplitScope(scope, VAR_SPLIT, "variable", "note"),
    undefined,
  );
  assertEqual(
    lookupSplitScope(extendScope(scope), VAR_SPLIT, "variable"),
    "note",
  );
  assertEqual(isSplitScopeUsed(scope, VAR_SPLIT, "variable"), false);
  assertSuccess(
    allignBlock(
      makeScopeBlock(
        scope,
        [],
        [
          makeEffectStatement(
            makeSplitScopeWriteEffect(
              scope,
              VAR_SPLIT,
              "variable",
              makeLiteralExpression("right"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeSplitScopeReadExpression(scope, VAR_SPLIT, "variable"),
            ),
          ),
        ],
      ),
      `
        {
          let x;
          x = 'right';
          effect(x);
        }
      `,
    ),
  );
}
