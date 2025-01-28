/**
 * @type {import("./naming").IntrinsicFunctionNaming}
 */
const INTRINSIC_FUNCTION_NAMING = {
  "aran.declareGlobal": "declareGlobalVariable",
  "aran.readGlobal": "readGlobalVariable",
  "aran.writeGlobalSloppy": "writeGlobalVariableSloppy",
  "aran.writeGlobalStrict": "writeGlobalVariableStrict",
  "aran.typeofGlobal": "typeofGlobalVariable",
  "aran.discardGlobal": "discardGlobalVariable",
  "aran.unary": "performUnaryOperation",
  "aran.binary": "performBinaryOperation",
  "aran.throw": "throwException",
  "aran.get": "getValueProperty",
  "aran.isConstructor": "isConstructor",
  "aran.sliceObject": "sliceObject",
  "aran.toArgumentList": "toArgumentList",
  "aran.listForInKey": "listForInKey",
  "aran.listRest": "listIteratorRest",
  "aran.toPropertyKey": "toPropertyKey",
  "aran.retropileEval": "retropileEvalCode",
  "aran.transpileEval": "transpileEvalCode",
};

/**
 * @type {import("./naming").ParameterFunctionNaming}
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
 *   intrinsic: keyof import("./naming").IntrinsicFunctionNaming,
 * ) => import("estree-sentry").VariableName}
 */
export const getIntrinsicFunctionName = (intrinsic) =>
  /** @type {import("estree-sentry").VariableName} */
  (INTRINSIC_FUNCTION_NAMING[intrinsic]);

/**
 * @type {(
 *   parameter: keyof import("./naming").ParameterFunctionNaming,
 * ) => import("estree-sentry").VariableName}
 */
export const getParameterFunctionName = (parameter) =>
  /** @type {import("estree-sentry").VariableName} */
  (PARAMETER_FUNCTION_NAMING[parameter]);
