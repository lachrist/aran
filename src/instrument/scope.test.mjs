import {assertThrow, assertEqual, assertDeepEqual} from "../__fixture__.mjs";

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
    /^Error: duplicate variable declaration/u,
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
    /^Error: unused variable should not be initialized/u,
  );
  assertEqual(isScopeVariableUsed(scope, "variable"), false);
  assertEqual(
    allignExpression(makeScopeReadExpression(scope, "variable"), "_x;"),
    null,
  );
  assertEqual(isScopeVariableUsed(scope, "variable"), true);
  assertDeepEqual(getUsedScopeVariableArray(scope), ["variable"]);
  // Initialize //
  assertEqual(isScopeVariableInitialized(scope, "variable"), false);
  assertEqual(
    allignEffect(
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
      "_x = 123;",
    ),
    null,
  );
  assertEqual(isScopeVariableInitialized(scope, "variable"), true);
  assertThrow(
    () =>
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
    /^Error: duplicate variable initialization/u,
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
  assertEqual(
    allignExpression(
      makeScopeReadExpression(scope, "variable"),
      `intrinsic.aran.get(
        intrinsic.aran.readGlobal("namespace"),
        'variable'
      );`,
    ),
    null,
  );
  assertThrow(
    () =>
      makeScopeInitializeEffect(scope, "variable", makeLiteralExpression(123)),
    /^Error: duplicate variable initialization/u,
  );
  assertEqual(
    allignEffect(
      makeScopeWriteEffect(scope, "variable", makeLiteralExpression(123)),
      `effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.readGlobal("namespace"),
          'variable',
          123,
        ),
      );`,
    ),
    null,
  );
}
