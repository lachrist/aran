import type { AssertNever, ValueOf } from "../util/util.d.ts";
import type { Intrinsic, Parameter } from "./syntax.d.ts";

export type IntrinsicFunctionNaming = {
  "aran.createObject": "createObject";
  "aran.declareGlobalVariable": "declareGlobalVariable";
  "aran.readGlobalVariable": "readGlobalVariable";
  "aran.writeGlobalVariableSloppy": "writeGlobalVariableSloppy";
  "aran.writeGlobalVariableStrict": "writeGlobalVariableStrict";
  "aran.typeofGlobalVariable": "typeofGlobalVariable";
  "aran.discardGlobalVariable": "discardGlobalVariable";
  "aran.performUnaryOperation": "performUnaryOperation";
  "aran.performBinaryOperation": "performBinaryOperation";
  "aran.throwException": "throwException";
  "aran.getValueProperty": "getValueProperty";
  "aran.isConstructor": "isConstructor";
  "aran.sliceObject": "sliceObject";
  "aran.toArgumentList": "toArgumentList";
  "aran.listForInKey": "listForInKey";
  "aran.listIteratorRest": "listIteratorRest";
  "aran.toPropertyKey": "toPropertyKey";
  "aran.retropileEvalCode": "retropileEvalCode";
  "aran.transpileEvalCode": "transpileEvalCode";
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
