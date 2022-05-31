import {assertThrow, assertEqual, assertSuccess} from "../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeReturnStatement,
} from "../ast/index.mjs";

import {allignBlock, allignProgram} from "../allign/index.mjs";

import {
  extendScope,
  createRootScope,
  declareScope,
  lookupScope,
  isScopeUsed,
  makeScopeReadExpression,
  makeScopeWriteEffect,
  makeScopeBlock,
  makeScopeScriptProgram,
} from "./scope.mjs";

const {undefined} = globalThis;

{
  const scope = createRootScope();
  assertThrow(() => lookupScope(extendScope(scope), "variable"), {
    name: "Error",
    message: "missing variable",
  });
  assertEqual(declareScope(scope, "variable", "note"), undefined);
  assertEqual(lookupScope(extendScope(scope), "variable"), "note");
  assertEqual(isScopeUsed(scope, "variable"), false);
  makeScopeReadExpression(scope, "variable");
  assertEqual(isScopeUsed(scope, "variable"), true);
}

{
  const scope = createRootScope();
  declareScope(scope, "variable", "note");
  assertSuccess(
    allignProgram(
      makeScopeScriptProgram(scope, [
        makeEffectStatement(
          makeExpressionEffect(makeScopeReadExpression(scope, "variable")),
        ),
        makeEffectStatement(
          makeScopeWriteEffect(
            scope,
            "variable",
            makeLiteralExpression("right"),
          ),
        ),
        makeReturnStatement(makeLiteralExpression("completion")),
      ]),
      `
        'script';
        let variable = undefined;
        effect(intrinsic.aran.getGlobal('variable'));
        effect(intrinsic.aran.setGlobalStrict('variable', 'right'));
        return 'completion';
      `,
    ),
  );
}

{
  const scope = extendScope(createRootScope());
  declareScope(scope, "variable");
  assertSuccess(
    allignBlock(
      makeScopeBlock(
        scope,
        ["label1", "label2"],
        [
          makeEffectStatement(
            makeExpressionEffect(makeScopeReadExpression(scope, "variable")),
          ),
          makeEffectStatement(
            makeScopeWriteEffect(
              scope,
              "variable",
              makeLiteralExpression("right"),
            ),
          ),
        ],
      ),
      `label1: label2: {
        let variable;
        effect(variable);
        variable = 'right';
      }`,
    ),
  );
}
