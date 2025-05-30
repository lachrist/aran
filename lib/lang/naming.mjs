/**
 * @type {import("./naming.d.ts").IntrinsicFunctionNaming}
 */
const INTRINSIC_FUNCTION_NAMING = {
  "aran.createObject": "createObject",
  "aran.declareGlobalVariable": "declareGlobalVariable",
  "aran.readGlobalVariable": "readGlobalVariable",
  "aran.writeGlobalVariableSloppy": "writeGlobalVariableSloppy",
  "aran.writeGlobalVariableStrict": "writeGlobalVariableStrict",
  "aran.typeofGlobalVariable": "typeofGlobalVariable",
  "aran.discardGlobalVariable": "discardGlobalVariable",
  "aran.performUnaryOperation": "performUnaryOperation",
  "aran.performBinaryOperation": "performBinaryOperation",
  "aran.throwException": "throwException",
  "aran.getValueProperty": "getValueProperty",
  "aran.isConstructor": "isConstructor",
  "aran.sliceObject": "sliceObject",
  "aran.toArgumentList": "toArgumentList",
  "aran.listForInKey": "listForInKey",
  "aran.listIteratorRest": "listIteratorRest",
  "aran.toPropertyKey": "toPropertyKey",
  "aran.retropileEvalCode": "retropileEvalCode",
  "aran.transpileEvalCode": "transpileEvalCode",
};

/**
 * @type {import("./naming.d.ts").ParameterFunctionNaming}
 */
const PARAMETER_FUNCTION_NAMING = {
  "import": "importModule",
  "super.get": "getSuperProperty",
  "super.set": "setSuperProperty",
  "super.call": "callSuperConstructor",
  "private.check": "registerPrivateProperty",
  "private.get": "getPrivateProperty",
  "private.set": "setPrivateProperty",
  "private.has": "hasPrivateProperty",
  "scope.read": "readVariable",
  "scope.writeStrict": "writeVariableStrict",
  "scope.writeSloppy": "writeVariableSloppy",
  "scope.typeof": "typeofVariable",
  "scope.discard": "discardVariable",
};

/**
 * @type {(
 *   intrinsic: keyof import("./naming.d.ts").IntrinsicFunctionNaming,
 * ) => import("estree-sentry").VariableName}
 */
export const getIntrinsicFunctionName = (intrinsic) =>
  /** @type {import("estree-sentry").VariableName} */
  (INTRINSIC_FUNCTION_NAMING[intrinsic]);

/**
 * @type {(
 *   parameter: keyof import("./naming.d.ts").ParameterFunctionNaming,
 * ) => import("estree-sentry").VariableName}
 */
export const getParameterFunctionName = (parameter) =>
  /** @type {import("estree-sentry").VariableName} */
  (PARAMETER_FUNCTION_NAMING[parameter]);
