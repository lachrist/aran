import { StaticError, map } from "../util/index.mjs";

import { packPrimitive } from "../syntax.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./syntax.mjs";

import { makeArrayExpression, makeJsonExpression } from "./intrinsic.mjs";

/**
 * @type {<S, L, V>(
 *   point: Point<Variable[], S, L, V>,
 *   options: {
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 * ) => Expression<Variable[]>[]}
 */
const listArgumentExpression = (
  point,
  { makeSerialExpression, makeLabelExpression, makeVariableExpression },
) => {
  switch (point.type) {
    case "program.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeJsonExpression(point.links),
        point.parameters,
        makeArrayExpression(
          map(point.variables, (variable) => makeVariableExpression(variable)),
        ),
        makeSerialExpression(point.serial),
      ];
    case "program.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "program.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "program.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial),
      ];
    case "closure.enter":
      return [
        makePrimitiveExpression(point.kind),
        point.callee,
        point.parameters,
        makeArrayExpression(
          map(point.variables, (variable) => makeVariableExpression(variable)),
        ),
        makeSerialExpression(point.serial),
      ];
    case "closure.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "closure.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "closure.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial),
      ];
    case "block.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeArrayExpression(map(point.labels, makeLabelExpression)),
        point.parameters,
        makeArrayExpression(map(point.variables, makeVariableExpression)),
        makeSerialExpression(point.serial),
      ];
    case "block.completion":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial),
      ];
    case "block.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "block.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial),
      ];
    case "return.before":
      return [point.value, makeSerialExpression(point.serial)];
    case "break.before":
      return [
        makeLabelExpression(point.label),
        makeSerialExpression(point.serial),
      ];
    case "debugger.before":
      return [makeSerialExpression(point.serial)];
    case "debugger.after":
      return [makeSerialExpression(point.serial)];
    case "branch.before":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "branch.after":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial),
      ];
    case "primitive.after":
      return [
        makePrimitiveExpression(packPrimitive(point.value)),
        makeSerialExpression(point.serial),
      ];
    case "parameter.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "intrinsic.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "import.after":
      return [
        makePrimitiveExpression(point.source),
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "closure.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.asynchronous),
        makePrimitiveExpression(point.generator),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "read.after":
      return [
        makeVariableExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "write.before":
      return [
        makeVariableExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "drop.before":
      return [point.value, makeSerialExpression(point.serial)];
    case "export.before":
      return [
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "conditional.before":
      return [point.value, makeSerialExpression(point.serial)];
    case "conditional.after":
      return [point.value, makeSerialExpression(point.serial)];
    case "eval.before":
      return [point.value, makeSerialExpression(point.serial)];
    case "eval.after":
      return [point.value, makeSerialExpression(point.serial)];
    case "await.before":
      return [point.value, makeSerialExpression(point.serial)];
    case "await.after":
      return [point.value, makeSerialExpression(point.serial)];
    case "yield.before":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "yield.after":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "apply":
      return [
        point.callee,
        point.this,
        makeArrayExpression(point.arguments),
        makeSerialExpression(point.serial),
      ];
    case "construct":
      return [
        point.callee,
        makeArrayExpression(point.arguments),
        makeSerialExpression(point.serial),
      ];
    case "enclave.read.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial),
      ];
    case "enclave.read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "enclave.typeof.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial),
      ];
    case "enclave.typeof.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "enclave.write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "enclave.write.after":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial),
      ];
    case "enclave.declare.before":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial),
      ];
    case "enclave.declare.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial),
      ];
    default:
      throw new StaticError("invalid point", point);
  }
};

/**
 * @type {<S, L, V>(
 *   point: Point<Variable[], S, L, V>,
 *   options: {
 *     advice: Expression<Variable[]>,
 *     makeSerialExpression: (value: S) => Expression<Variable[]>,
 *     makeLabelExpression: (value: L) => Expression<Variable[]>,
 *     makeVariableExpression: (value: V) => Expression<Variable[]>,
 *   },
 * ) => Expression<Variable[]>}
 */
export const makeTriggerExpression = (point, options) =>
  makeApplyExpression(
    makeApplyExpression(
      makeIntrinsicExpression("aran.get"),
      makePrimitiveExpression({ undefined: null }),
      [options.advice, makePrimitiveExpression(point.type)],
    ),
    options.advice,
    listArgumentExpression(point, options),
  );
