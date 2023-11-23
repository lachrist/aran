import { map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import { packPrimitive } from "../lang.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadGlobalExpression,
} from "./node.mjs";
import {
  makeArrayExpression,
  makeObjectExpression,
  makeJsonExpression,
} from "./intrinsic.mjs";
import { makeReadLocationExpression } from "./variable.mjs";

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
 *   point: Point<S>,
 * ) => [string, aran.Expression<weave.ResAtom>][]}
 */
const listPointProperty = (point) => {
  switch (point.type) {
    case "program.enter": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["links", makeJsonExpression(point.links)],
        ["record", makeFrameExpression(point.record)],
      ];
    }
    case "program.completion": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ];
    }
    case "program.failure": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ];
    }
    case "program.leave": {
      return [["kind", makePrimitiveExpression(point.kind)]];
    }
    case "closure.enter": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["callee", point.callee],
        ["record", makeFrameExpression(point.record)],
      ];
    }
    case "closure.completion": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ];
    }
    case "closure.failure": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ];
    }
    case "closure.leave": {
      return [["kind", makePrimitiveExpression(point.kind)]];
    }
    case "block.enter": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        [
          "labels",
          makeArrayExpression(map(point.labels, makePrimitiveExpression)),
        ],
        ["record", makeFrameExpression(point.record)],
      ];
    }
    case "block.completion": {
      return [["kind", makePrimitiveExpression(point.kind)]];
    }
    case "block.failure": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ];
    }
    case "block.leave": {
      return [["kind", makePrimitiveExpression(point.kind)]];
    }
    case "return.before": {
      return [["value", point.value]];
    }
    case "break.before": {
      return [["label", makePrimitiveExpression(point.label)]];
    }
    case "debugger.before": {
      return [];
    }
    case "debugger.after": {
      return [];
    }
    case "branch.before": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ];
    }
    case "branch.after": {
      return [["kind", makePrimitiveExpression(point.kind)]];
    }
    case "primitive.after": {
      return [["value", makePrimitiveExpression(packPrimitive(point.value))]];
    }
    case "intrinsic.after": {
      return [
        ["name", makePrimitiveExpression(point.name)],
        ["value", point.value],
      ];
    }
    case "import.after": {
      return [
        ["source", makePrimitiveExpression(point.source)],
        ["specifier", makePrimitiveExpression(point.specifier)],
        ["value", point.value],
      ];
    }
    case "function.after": {
      return [
        ["asynchronous", makePrimitiveExpression(point.asynchronous)],
        ["generator", makePrimitiveExpression(point.generator)],
        ["value", point.value],
      ];
    }
    case "arrow.after": {
      return [
        ["asynchronous", makePrimitiveExpression(point.asynchronous)],
        ["value", point.value],
      ];
    }
    case "read.after": {
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ];
    }
    case "write.before": {
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ];
    }
    case "drop.before": {
      return [["value", point.value]];
    }
    case "export.before": {
      return [
        ["specifier", makePrimitiveExpression(point.specifier)],
        ["value", point.value],
      ];
    }
    case "conditional.before": {
      return [["value", point.value]];
    }
    case "conditional.after": {
      return [["value", point.value]];
    }
    case "eval.before": {
      return [
        ["value", point.value],
        // It seems branded string prevent assignment to Json.
        ["context", makeJsonExpression(/** @type {Json} */ (point.context))],
      ];
    }
    case "eval.after": {
      return [["value", point.value]];
    }
    case "await.before": {
      return [["value", point.value]];
    }
    case "await.after": {
      return [["value", point.value]];
    }
    case "yield.before": {
      return [
        ["delegate", makePrimitiveExpression(point.delegate)],
        ["value", point.value],
      ];
    }
    case "yield.after": {
      return [
        ["delegate", makePrimitiveExpression(point.delegate)],
        ["value", point.value],
      ];
    }
    case "apply": {
      return [
        ["callee", point.callee],
        ["this", point.this],
        ["arguments", makeArrayExpression(point.arguments)],
      ];
    }
    case "construct": {
      return [
        ["callee", point.callee],
        ["arguments", makeArrayExpression(point.arguments)],
      ];
    }
    case "global.read.before": {
      return [["variable", makePrimitiveExpression(point.variable)]];
    }
    case "global.read.after": {
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ];
    }
    case "global.typeof.before": {
      return [["variable", makePrimitiveExpression(point.variable)]];
    }
    case "global.typeof.after": {
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ];
    }
    case "global.write.before": {
      return [
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ];
    }
    case "global.write.after": {
      return [["variable", makePrimitiveExpression(point.variable)]];
    }
    case "global.declare.before": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["variable", makePrimitiveExpression(point.variable)],
      ];
    }
    case "global.declare.after": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["variable", makePrimitiveExpression(point.variable)],
      ];
    }
    default: {
      throw new AranTypeError("invalid point", point);
    }
  }
};

/**
 * @type {<S extends Json>(
 *   point: Point<S>,
 *   path: weave.TargetPath,
 *   advice: {
 *     kind: "object" | "function",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeTriggerExpression = (point, path, { variable, kind }) => {
  switch (kind) {
    case "function": {
      return makeApplyExpression(
        makeReadGlobalExpression(variable),
        makePrimitiveExpression({ undefined: null }),
        [
          makeObjectExpression(
            makePrimitiveExpression(null),
            map(
              [
                ["type", makePrimitiveExpression(point.type)],
                ...listPointProperty(point),
                ["location", makeReadLocationExpression(path, point.location)],
              ],
              wrapKey,
            ),
          ),
        ],
      );
    }
    case "object": {
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
        [
          ...map(listPointProperty(point), getSecond),
          makeReadLocationExpression(path, point.location),
        ],
      );
    }
    default: {
      throw new AranTypeError("invalid advice kind", kind);
    }
  }
};
