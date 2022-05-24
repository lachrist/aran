import {
  assertThrow,
  assertEqual,
  assertSuccess,
  assertDeepEqual,
} from "../__fixture__.mjs";

import {makeLiteralExpression} from "../ast/index.mjs";

import {allignEffect, allignExpression} from "../allign/index.mjs";

import {
  createRootScope,
  extendScriptScope,
  extendScope,
  declareScopeVariable,
  lookupScopeVariable,
  makeScopeWriteEffect,
  makeScopeInitializeEffect,
  makeScopeReadExpression,
  isScopeVariableUsed,
  isScopeVariableInitialized,
  getUsedScopeVariableArray,
} from "./scope.mjs";

{
  const scope = extendScope(createRootScope());
  // Declare //
  declareScopeVariable(scope, {
    variable: "variable",
    value: "data1",
    duplicable: false,
    initialized: false,
  });
  assertThrow(
    () =>
      declareScopeVariable(scope, {
        variable: "variable",
        value: "data2",
        duplicable: false,
        initialized: false,
      }),
    {
      name: "AssertionError",
      message: "duplicate variable declaration",
    },
  );
  declareScopeVariable(scope, {
    variable: "variable",
    value: "data3",
    duplicable: true,
    initialized: false,
  });
  assertEqual(lookupScopeVariable(scope, "variable"), "data1");
  // Used //
  assertDeepEqual(getUsedScopeVariableArray(scope), []);
  assertThrow(
    () =>
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
    {
      name: "AssertionError",
      message: "unused variable should not be initialized",
    },
  );
  assertEqual(isScopeVariableUsed(scope, "variable"), false);
  assertSuccess(
    allignExpression(makeScopeReadExpression(scope, "variable"), "_x;"),
  );
  assertEqual(isScopeVariableUsed(scope, "variable"), true);
  assertDeepEqual(getUsedScopeVariableArray(scope), ["variable"]);
  // Initialize //
  assertEqual(isScopeVariableInitialized(scope, "variable"), false);
  assertSuccess(
    allignEffect(
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
      "_x = 123;",
    ),
  );
  assertEqual(isScopeVariableInitialized(scope, "variable"), true);
  assertThrow(
    () =>
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
    {
      name: "AssertionError",
      message: "duplicate variable initialization",
    },
  );
}

{
  const scope = extendScriptScope(createRootScope(), "namespace");
  declareScopeVariable(scope, {
    variable: "variable",
    value: "data",
    duplicable: false,
    initialized: true,
  });
  assertSuccess(
    allignExpression(
      makeScopeReadExpression(scope, "variable"),
      `intrinsic.aran.get(
        intrinsic.aran.getGlobal("namespace"),
        'variable'
      );`,
    ),
  );
  assertThrow(
    () =>
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
    {
      name: "AssertionError",
      message: "duplicate variable initialization",
    },
  );
  assertSuccess(
    allignEffect(
      makeScopeWriteEffect(scope, "variable", makeLiteralExpression(123)),
      `effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.getGlobal("namespace"),
          'variable',
          123,
        ),
      );`,
    ),
  );
}
