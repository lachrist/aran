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
  isRECVariable,
  isTECVariable,
  isWECVariable,
} from "./variable.mjs";

const {
  Error,
  Object: {entries: toEntries},
} = globalThis;

export const PERFORM_DYNAMIC_IMPORT = "import";
export const PERFORM_GET_SUPER_ENCLAVE = "get_super";
export const PERFORM_SET_SUPER_ENCLAVE = "set_super";
export const PERFORM_CALL_SUPER_ENCLAVE = "call_super";

const makeSimpleArrowExpression = (expression) =>
  makeClosureExpression(
    "arrow",
    false,
    false,
    makeBlock([], [], [makeReturnStatement(expression)]),
  );

const makeArgumentExpression = (literal) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get"),
    makeLiteralExpression({undefined: null}),
    [makeInputExpression(), makeLiteralExpression(literal)],
  );

const makeLiteralProperty = (entry) => [
  makeLiteralExpression(entry[0]),
  makeLiteralExpression(entry[1]),
];

export const makeInitializeExpression = (variable) => {
  if (isNewVariable(variable)) {
    if (variable === makeNewVariable(PERFORM_GET_SUPER_ENCLAVE)) {
      return makeSimpleArrowExpression(
        makeGetSuperEnclaveExpression(makeArgumentExpression(0)),
      );
    }
    if (variable === makeNewVariable(PERFORM_SET_SUPER_ENCLAVE)) {
      return makeClosureExpression(
        "arrow",
        false,
        false,
        makeBlock(
          [],
          ["input"],
          [
            makeEffectStatement(
              makeWriteEffect("input", makeInputExpression()),
            ),
            makeEffectStatement(
              makeSetSuperEnclaveEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.get"),
                  makeLiteralExpression({undefined: null}),
                  [makeReadExpression("input"), makeLiteralExpression(0)],
                ),
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.get"),
                  makeLiteralExpression({undefined: null}),
                  [makeReadExpression("input"), makeLiteralExpression(1)],
                ),
              ),
            ),
            makeReturnStatement(makeLiteralExpression({undefined: null})),
          ],
        ),
      );
    }
    if (variable === makeNewVariable(PERFORM_CALL_SUPER_ENCLAVE)) {
      return makeSimpleArrowExpression(
        makeCallSuperEnclaveExpression(makeArgumentExpression(0)),
      );
    }
    if (variable === makeNewVariable(PERFORM_DYNAMIC_IMPORT)) {
      return makeSimpleArrowExpression(
        makeDynamicImportExpression(makeArgumentExpression(0)),
      );
    }
    throw new Error("could not initialized new variable");
  }
  if (isRECVariable(variable)) {
    return makeSimpleArrowExpression(
      makeReadEnclaveExpression(getVariableBody(variable)),
    );
  }
  if (isTECVariable(variable)) {
    return makeSimpleArrowExpression(
      makeTypeofEnclaveExpression(getVariableBody(variable)),
    );
  }
  if (isWECVariable(variable)) {
    return makeSimpleArrowExpression(
      makeSequenceExpression(
        makeWriteEnclaveEffect(
          getVariableBody(variable),
          makeArgumentExpression(0),
        ),
        makeLiteralExpression({undefined: null}),
      ),
    );
  }
  if (isLabVariable(variable)) {
    return makeObjectExpression(
      makeLiteralExpression(null),
      map(
        toEntries(unmangleLabel(getVariableBody(variable))),
        makeLiteralProperty,
      ),
    );
  }
  if (isVarVariable(variable)) {
    return makeObjectExpression(
      makeLiteralExpression(null),
      map(
        toEntries(unmangleVariable(getVariableBody(variable))),
        makeLiteralProperty,
      ),
    );
  }
  throw new Error("could not initialize variable");
};
