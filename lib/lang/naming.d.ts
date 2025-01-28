import type { AssertNever, ValueOf } from "../util/util";
import type { Intrinsic, Parameter } from "./syntax";

export type IntrinsicFunctionNaming = {
  "aran.declareGlobal": "declareGlobalVariable";
  "aran.readGlobal": "readGlobalVariable";
  "aran.writeGlobalSloppy": "writeGlobalVariableSloppy";
  "aran.writeGlobalStrict": "writeGlobalVariableStrict";
  "aran.typeofGlobal": "typeofGlobalVariable";
  "aran.discardGlobal": "discardGlobalVariable";
  "aran.performUnaryOperation": "performUnaryOperation";
  "aran.binary": "performBinaryOperation";
  "aran.throw": "throwException";
  "aran.get": "getValueProperty";
  "aran.isConstructor": "isConstructor";
  "aran.sliceObject": "sliceObject";
  "aran.toArgumentList": "toArgumentList";
  "aran.listForInKey": "listForInKey";
  "aran.listRest": "listIteratorRest";
  "aran.toPropertyKey": "toPropertyKey";
  "aran.retropileEval": "retropileEvalCode";
  "aran.transpileEval": "transpileEvalCode";
};

export type ParameterFunctionNaming = {
  "import": "importModule";
  "super.get": "getSuperProperty";
  "super.set": "setSuperProperty";
  "super.call": "callSuperConstructor";
  "private.check": "registerPrivateProperty";
  "private.get": "getPrivateProperty";
  "private.set": "setPrivateProperty";
  "private.has": "hasPrivateProperty";
  "scope.read": "readVariable";
  "scope.writeStrict": "writeVariableStrict";
  "scope.writeSloppy": "writeVariableSloppy";
  "scope.typeof": "typeofVariable";
  "scope.discard": "discardVariable";
};

type __check = [
  AssertNever<Exclude<keyof IntrinsicFunctionNaming, Intrinsic>>,
  AssertNever<Exclude<keyof ParameterFunctionNaming, Parameter>>,
];

export type IntrinsicFunctionName = ValueOf<IntrinsicFunctionNaming>;

export type ParameterFunctionName = ValueOf<ParameterFunctionNaming>;
