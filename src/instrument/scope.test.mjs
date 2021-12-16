import {assertThrow, assertEqual, assertDeepEqual} from "../__fixture__.mjs";

import {makeLiteralExpression} from "../ast/index.mjs";
import {allignEffect, allignExpression} from "../allign/index.mjs";

import {
  makeRootScope,
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
  const scope = extendScope(makeRootScope());
  // Declare //
  declareScopeVariable(scope, "variable", "data1", false, false);
  assertThrow(
    () => declareScopeVariable(scope, "variable", "data2", false, false),
    /^Error: duplicate variable declaration/u,
  );
  declareScopeVariable(scope, "variable", "data3", true, false);
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
  const scope = extendScriptScope(makeRootScope(), "namespace");
  declareScopeVariable(scope, "variable", "data", false, true);
  assertEqual(
    allignExpression(
      makeScopeReadExpression(scope, "variable"),
      "intrinsic('Reflect.get')(undefined, $namespace, 'variable');",
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
      "effect(intrinsic('Reflect.set')(undefined, $namespace, 'variable', 123));",
    ),
    null,
  );
}
