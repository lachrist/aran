import { StaticError, map } from "../util/index.mjs";

import { packPrimitive } from "../syntax.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "./syntax.mjs";

import {
  makeLabReadExpression,
  makeNewReadExpression,
  makeVarReadExpression,
} from "./layer.mjs";

import { makeArrayExpression, makeJsonExpression } from "./intrinsic.mjs";

import { mangleSerialVariable } from "./variable.mjs";

/**
 * @type {<S extends Json>(
 *   serial: S,
 *   path: string,
 *   context: {
 *     inline: { serial: boolean },
 *   },
 * ) => Expression<Usage>}
 */
const makeSerialExpression = (serial, path, { inline: { serial: inline } }) =>
  inline
    ? makeJsonExpression(serial)
    : makeNewReadExpression(mangleSerialVariable(path), serial);

/**
 * @type {<L extends Json>(
 *   label: L,
 *   context: {
 *     inline: { label: boolean },
 *     stringifyLabel: (label: L) => Label,
 *   },
 * ) => Expression<Usage>}
 */
const makeLabelExpression = (
  label,
  { inline: { label: inline }, stringifyLabel },
) =>
  inline
    ? makeJsonExpression(label)
    : makeLabReadExpression(stringifyLabel(label), label);

/**
 * @type {<V extends Json>(
 *   variable: V,
 *   context: {
 *     inline: { variable: boolean },
 *     stringifyVariable: (variable: V) => Variable,
 *   },
 * ) => Expression<Usage>}
 */
const makeVariableExpression = (
  variable,
  { inline: { variable: inline }, stringifyVariable },
) =>
  inline
    ? makeJsonExpression(variable)
    : makeVarReadExpression(stringifyVariable(variable), variable);

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: {
 *     inline: { label: boolean, serial: boolean, variable: boolean },
 *     stringifyLabel: (variable: L) => Label,
 *     stringifyVariable: (variable: V) => Variable,
 *   },
 * ) => Expression<Usage>[]}
 */
const listArgumentExpression = (point, path, context) => {
  switch (point.type) {
    case "program.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeJsonExpression(point.links),
        point.parameters,
        makeArrayExpression(
          map(point.variables, (variable) =>
            makeVariableExpression(variable, context),
          ),
        ),
        makeSerialExpression(point.serial, path, context),
      ];
    case "program.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "program.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "program.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, path, context),
      ];
    case "closure.enter":
      return [
        makePrimitiveExpression(point.kind),
        point.callee,
        point.parameters,
        makeArrayExpression(
          map(point.variables, (variable) =>
            makeVariableExpression(variable, context),
          ),
        ),
        makeSerialExpression(point.serial, path, context),
      ];
    case "closure.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "closure.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "closure.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, path, context),
      ];
    case "block.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeArrayExpression(
          map(point.labels, (label) => makeLabelExpression(label, context)),
        ),
        point.parameters,
        makeArrayExpression(
          map(point.variables, (variable) =>
            makeVariableExpression(variable, context),
          ),
        ),
        makeSerialExpression(point.serial, path, context),
      ];
    case "block.completion":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, path, context),
      ];
    case "block.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "block.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, path, context),
      ];
    case "return.before":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "break.before":
      return [
        makeLabelExpression(point.label, context),
        makeSerialExpression(point.serial, path, context),
      ];
    case "debugger.before":
      return [makeSerialExpression(point.serial, path, context)];
    case "debugger.after":
      return [makeSerialExpression(point.serial, path, context)];
    case "test.before":
      return [makeSerialExpression(point.serial, path, context)];
    case "primitive.after":
      return [
        makePrimitiveExpression(packPrimitive(point.value)),
        makeSerialExpression(point.serial, path, context),
      ];
    case "parameter.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "intrinsic.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "import.after":
      return [
        makePrimitiveExpression(point.source),
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "closure.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.asynchronous),
        makePrimitiveExpression(point.generator),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "read.after":
      return [
        makeVariableExpression(point.variable, context),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "write.before":
      return [
        makeVariableExpression(point.variable, context),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "drop.before":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "export.before":
      return [
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "conditional.before":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "conditional.after":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "eval.before":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "eval.after":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "await.before":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "await.after":
      return [point.value, makeSerialExpression(point.serial, path, context)];
    case "yield.before":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "yield.after":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "apply":
      return [
        point.callee,
        point.this,
        makeArrayExpression(point.arguments),
        makeSerialExpression(point.serial, path, context),
      ];
    case "construct":
      return [
        point.callee,
        makeArrayExpression(point.arguments),
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.read.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.typeof.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.typeof.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.write.after":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.declare.before":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, path, context),
      ];
    case "enclave.declare.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, path, context),
      ];
    default:
      throw new StaticError("invalid point", point);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: {
 *     advice: Variable,
 *     inline: { label: boolean, serial: boolean, variable: boolean },
 *     stringifyLabel: (variable: L) => Label,
 *     stringifyVariable: (variable: V) => Variable,
 *   },
 * ) => Expression<Usage>}
 */
export const makeTriggerExpression = (point, path, context) =>
  makeApplyExpression(
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makePrimitiveExpression({ undefined: null }),
      [
        makeReadExpression(context.advice, {}),
        makePrimitiveExpression(point.type),
      ],
    ),
    makeReadExpression(context.advice, {}),
    listArgumentExpression(point, path, context),
  );
