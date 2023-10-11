import { StaticError, map } from "../util/index.mjs";

import { packPrimitive } from "../lang.mjs";

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeReadGlobalExpression,
} from "./node.mjs";

import {
  makeArrayExpression,
  makeObjectExpression,
  makeJsonExpression,
} from "./intrinsic.mjs";

import { mangleLocationVariable } from "./variable.mjs";

/**
 * @template L
 * @typedef {(
 *   import("../../type/advice.js").Point<aran.Expression<weave.ResAtom>, L>
 * )} Point
 */

const {
  Object: { entries: listEntry },
} = globalThis;

/** @type {<X, Y>(pair: [X, Y]) => Y} */
const getSecond = ([_x, y]) => y;

/**
 * @type {(
 *   pair: [string, aran.Expression<weave.ResAtom>],
 * ) => [
 *   aran.Expression<weave.ResAtom>,
 *   aran.Expression<weave.ResAtom>,
 * ]}
 */
const wrapKey = ([key, val]) => [makePrimitiveExpression(key), val];

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
 * ) => [string, aran.Expression<weave.ResAtom>][]}
 */
const listPointProperty = (point, options) => {
  switch (point.type) {
    case "program.enter":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["links", makeJsonExpression(point.links)],
        ["record", makeFrameExpression(point.record)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "program.completion":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "program.failure":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "program.leave":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "function.enter":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["callee", point.callee],
        ["record", makeFrameExpression(point.record)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "function.completion":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "function.failure":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "function.leave":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "block.enter":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        [
          "labels",
          makeArrayExpression(map(point.labels, makePrimitiveExpression)),
        ],
        ["record", makeFrameExpression(point.record)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "block.completion":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "block.failure":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "block.leave":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "return.before":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "break.before":
      return [
        ["label", makePrimitiveExpression(point.label)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "debugger.before":
      return [["location", makeLocationExpression(point.location, options)]];
    case "debugger.after":
      return [["location", makeLocationExpression(point.location, options)]];
    case "branch.before":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "branch.after":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "primitive.after":
      return [
        ["value", makePrimitiveExpression(packPrimitive(point.value))],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "intrinsic.after":
      return [
        ["name", makePrimitiveExpression(point.name)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "import.after":
      return [
        ["source", makePrimitiveExpression(point.source)],
        ["specifier", makePrimitiveExpression(point.specifier)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "function.after":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["asynchronous", makePrimitiveExpression(point.asynchronous)],
        ["generator", makePrimitiveExpression(point.generator)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "read.after":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "write.before":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "drop.before":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "export.before":
      return [
        ["specifier", makePrimitiveExpression(point.specifier)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "conditional.before":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "conditional.after":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "eval.before":
      return [
        ["value", point.value],
        // It seems branded string prevent assignment to Json.
        ["context", makeJsonExpression(/** @type {Json} */ (point.context))],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "eval.after":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "await.before":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "await.after":
      return [
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "yield.before":
      return [
        ["delegate", makePrimitiveExpression(point.delegate)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "yield.after":
      return [
        ["delegate", makePrimitiveExpression(point.delegate)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "apply":
      return [
        ["callee", point.callee],
        ["this", point.this],
        ["arguments", makeArrayExpression(point.arguments)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "construct":
      return [
        ["callee", point.callee],
        ["arguments", makeArrayExpression(point.arguments)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.read.before":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.read.after":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.typeof.before":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.typeof.after":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.write.before":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.write.after":
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.declare.before":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
        ["location", makeLocationExpression(point.location, options)],
      ];
    case "global.declare.after":
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["variable", makePrimitiveExpression(point.variable)],
        ["location", makeLocationExpression(point.location, options)],
      ];
    default:
      throw new StaticError("invalid point", point);
  }
};

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   options: {
 *     advice: import("../../type/options.d.ts").Advice,
 *     location: "inline" | "extract",
 *   },
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeTriggerExpression = (
  point,
  { advice: { variable, kind }, location },
) => {
  switch (kind) {
    case "function":
      return makeApplyExpression(
        makeReadGlobalExpression(variable),
        makePrimitiveExpression({ undefined: null }),
        [
          makeObjectExpression(
            makePrimitiveExpression(null),
            map(
              [
                ["type", makePrimitiveExpression(point.type)],
                ...listPointProperty(point, { location }),
              ],
              wrapKey,
            ),
          ),
        ],
      );
    case "object":
      return makeApplyExpression(
        makeApplyExpression(
          makeIntrinsicExpression("aran.get"),
          makePrimitiveExpression({ undefined: null }),
          [
            makeReadGlobalExpression(variable),
            makePrimitiveExpression(point.type),
          ],
        ),
        makeReadGlobalExpression(variable),
        map(listPointProperty(point, { location }), getSecond),
      );
    default:
      throw new StaticError("invalid advice kind", kind);
  }
};
