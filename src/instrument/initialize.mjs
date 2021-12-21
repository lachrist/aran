import {map} from "array-lite";

import {
  makeClosureExpression,
  makeBlock,
  makeReturnStatement,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeInputExpression,
  makeGetSuperEnclaveExpression,
  makeSequenceExpression,
  makeSetSuperEnclaveEffect,
  makeCallSuperEnclaveExpression,
  makeDynamicImportExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeApplyExpression,
  makeObjectExpression,
  makeWriteEnclaveEffect,
  makeEffectStatement,
  makeWriteEffect,
  makeReadExpression,
} from "../ast/index.mjs";

import {unmangleLabel, unmangleVariable} from "./unmangle.mjs";

import {
  makeNewVariable,
  getVariableBody,
  isNewVariable,
  isLabVariable,
  isVarVariable,
} from "./variable.mjs";

const {
  Error,
  Object: {entries: toEntries},
} = globalThis;
