import { StaticError, map } from "../util/index.mjs";

import { packPrimitive } from "../lang.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "./node.mjs";

import {
  makeArrayExpression,
  makeObjectExpression,
  makeJsonExpression,
} from "./intrinsic.mjs";

import { mangleSerialVariable } from "./variable.mjs";

/**
 * @template S
 * @typedef {import("./advice.js").Point<S>} Point
 */

const {
  Object: { entries: listEntry },
} = globalThis;

/**
 * @type {(
 *   entry: [string, aran.Expression<weave.ResAtom>],
 * ) => [aran.Expression<weave.ResAtom>, aran.Expression<weave.ResAtom>]}
 */
const makeFrameEntry = ([key, val]) => [makePrimitiveExpression(key), val];

/**
 * @type {(
 *   frame: {[key in aran.Parameter | unbuild.Variable]: aran.Expression<weave.ResAtom>},
 * ) => aran.Expression<weave.ResAtom>}
 */
const makeFrameExpression = (frame) =>
  makeObjectExpression(
    makeIntrinsicExpression("Object.prototype"),
    map(listEntry(frame), makeFrameEntry),
  );

/**
 * @type {<S extends Json>(
 *   serial: S,
 *   options: { serial: "inline" | "extract" },
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeSerialExpression = (serial, { serial: serial_option }) => {
  switch (serial_option) {
    case "inline":
      return makeJsonExpression(serial);
    case "extract":
      return makeReadExpression(mangleSerialVariable(serial));
    default:
      throw new StaticError("invalid serial option", serial_option);
  }
};

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: { serial: "inline" | "extract" },
 * ) => aran.Expression<weave.ResAtom>[]}
 */
const listArgumentExpression = (point, options) => {
  switch (point.type) {
    case "program.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeJsonExpression(point.links),
        makeFrameExpression(point.frame),
        makeSerialExpression(point.serial, options),
      ];
    case "program.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "program.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "program.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, options),
      ];
    case "function.enter":
      return [
        makePrimitiveExpression(point.kind),
        point.callee,
        makeFrameExpression(point.frame),
        makeSerialExpression(point.serial, options),
      ];
    case "function.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "function.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "function.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, options),
      ];
    case "block.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeArrayExpression(map(point.labels, makePrimitiveExpression)),
        makeFrameExpression(point.frame),
        makeSerialExpression(point.serial, options),
      ];
    case "block.completion":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, options),
      ];
    case "block.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "block.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, options),
      ];
    case "return.before":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "break.before":
      return [
        makePrimitiveExpression(point.label),
        makeSerialExpression(point.serial, options),
      ];
    case "debugger.before":
      return [makeSerialExpression(point.serial, options)];
    case "debugger.after":
      return [makeSerialExpression(point.serial, options)];
    case "branch.before":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "branch.after":
      return [
        makePrimitiveExpression(point.kind),
        makeSerialExpression(point.serial, options),
      ];
    case "primitive.after":
      return [
        makePrimitiveExpression(packPrimitive(point.value)),
        makeSerialExpression(point.serial, options),
      ];
    case "intrinsic.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "import.after":
      return [
        makePrimitiveExpression(point.source),
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "function.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.asynchronous),
        makePrimitiveExpression(point.generator),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "drop.before":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "export.before":
      return [
        makePrimitiveExpression(point.specifier),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "conditional.before":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "conditional.after":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "eval.before":
      return [
        point.value,
        // It seems branded string prevent assignment to Json.
        makeJsonExpression(/** @type {Json} */ (point.context)),
        makeSerialExpression(point.serial, options),
      ];
    case "eval.after":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "await.before":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "await.after":
      return [point.value, makeSerialExpression(point.serial, options)];
    case "yield.before":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "yield.after":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "apply":
      return [
        point.callee,
        point.this,
        makeArrayExpression(point.arguments),
        makeSerialExpression(point.serial, options),
      ];
    case "construct":
      return [
        point.callee,
        makeArrayExpression(point.arguments),
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.read.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.typeof.before":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.typeof.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.write.after":
      return [
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.declare.before":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.value,
        makeSerialExpression(point.serial, options),
      ];
    case "enclave.declare.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        makeSerialExpression(point.serial, options),
      ];
    default:
      throw new StaticError("invalid point", point);
  }
};

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: {
 *     advice: aran.Expression<weave.ResAtom>,
 *     serial: "inline" | "extract",
 *   },
 * ) => aran.Expression<weave.ResAtom>}
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
