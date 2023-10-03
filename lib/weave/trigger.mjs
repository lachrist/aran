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

import { mangleLocationVariable } from "./variable.mjs";

/**
 * @template S
 * @typedef {import("../../type/advice.js").Point<S>} Point
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
 *   location: S,
 *   options: { location: "inline" | "extract" },
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeLocationExpression = (
  location,
  { location: location_option },
) => {
  switch (location_option) {
    case "inline":
      return makeJsonExpression(location);
    case "extract":
      return makeReadExpression(mangleLocationVariable(location));
    default:
      throw new StaticError("invalid location option", location_option);
  }
};

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: { location: "inline" | "extract" },
 * ) => aran.Expression<weave.ResAtom>[]}
 */
const listArgumentExpression = (point, options) => {
  switch (point.type) {
    case "program.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeJsonExpression(point.links),
        makeFrameExpression(point.record),
        makeLocationExpression(point.location, options),
      ];
    case "program.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "program.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "program.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeLocationExpression(point.location, options),
      ];
    case "function.enter":
      return [
        makePrimitiveExpression(point.kind),
        point.callee,
        makeFrameExpression(point.record),
        makeLocationExpression(point.location, options),
      ];
    case "function.completion":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "function.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "function.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeLocationExpression(point.location, options),
      ];
    case "block.enter":
      return [
        makePrimitiveExpression(point.kind),
        makeArrayExpression(map(point.labels, makePrimitiveExpression)),
        makeFrameExpression(point.record),
        makeLocationExpression(point.location, options),
      ];
    case "block.completion":
      return [
        makePrimitiveExpression(point.kind),
        makeLocationExpression(point.location, options),
      ];
    case "block.failure":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "block.leave":
      return [
        makePrimitiveExpression(point.kind),
        makeLocationExpression(point.location, options),
      ];
    case "return.before":
      return [point.value, makeLocationExpression(point.location, options)];
    case "break.before":
      return [
        makePrimitiveExpression(point.label),
        makeLocationExpression(point.location, options),
      ];
    case "debugger.before":
      return [makeLocationExpression(point.location, options)];
    case "debugger.after":
      return [makeLocationExpression(point.location, options)];
    case "branch.before":
      return [
        makePrimitiveExpression(point.kind),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "branch.after":
      return [
        makePrimitiveExpression(point.kind),
        makeLocationExpression(point.location, options),
      ];
    case "primitive.after":
      return [
        makePrimitiveExpression(packPrimitive(point.value)),
        makeLocationExpression(point.location, options),
      ];
    case "intrinsic.after":
      return [
        makePrimitiveExpression(point.name),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "import.after":
      return [
        makePrimitiveExpression(point.source),
        makePrimitiveExpression(point.specifier),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "function.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.asynchronous),
        makePrimitiveExpression(point.generator),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "drop.before":
      return [point.value, makeLocationExpression(point.location, options)];
    case "export.before":
      return [
        makePrimitiveExpression(point.specifier),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "conditional.before":
      return [point.value, makeLocationExpression(point.location, options)];
    case "conditional.after":
      return [point.value, makeLocationExpression(point.location, options)];
    case "eval.before":
      return [
        point.value,
        // It seems branded string prevent assignment to Json.
        makeJsonExpression(/** @type {Json} */ (point.context)),
        makeLocationExpression(point.location, options),
      ];
    case "eval.after":
      return [point.value, makeLocationExpression(point.location, options)];
    case "await.before":
      return [point.value, makeLocationExpression(point.location, options)];
    case "await.after":
      return [point.value, makeLocationExpression(point.location, options)];
    case "yield.before":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "yield.after":
      return [
        makePrimitiveExpression(point.delegate),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "apply":
      return [
        point.callee,
        point.this,
        makeArrayExpression(point.arguments),
        makeLocationExpression(point.location, options),
      ];
    case "construct":
      return [
        point.callee,
        makeArrayExpression(point.arguments),
        makeLocationExpression(point.location, options),
      ];
    case "global.read.before":
      return [
        makePrimitiveExpression(point.variable),
        makeLocationExpression(point.location, options),
      ];
    case "global.read.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "global.typeof.before":
      return [
        makePrimitiveExpression(point.variable),
        makeLocationExpression(point.location, options),
      ];
    case "global.typeof.after":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "global.write.before":
      return [
        makePrimitiveExpression(point.variable),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "global.write.after":
      return [
        makePrimitiveExpression(point.variable),
        makeLocationExpression(point.location, options),
      ];
    case "global.declare.before":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        point.value,
        makeLocationExpression(point.location, options),
      ];
    case "global.declare.after":
      return [
        makePrimitiveExpression(point.kind),
        makePrimitiveExpression(point.variable),
        makeLocationExpression(point.location, options),
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
 *     location: "inline" | "extract",
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
