import {
  EMPTY,
  concatX_,
  concat_,
  concat_X,
  concat_X_,
  flatMap,
  listEntry,
  map,
  pairup,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { packPrimitive } from "../../lang.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "./node.mjs";
import { makeJsonExpression } from "./json.mjs";
import {
  ADVICE_VARIABLE,
  FRAME_VARIABLE,
  mangleLocationVariable,
} from "./variable.mjs";
import {
  initSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  liftSequence_XX,
  liftSequence__X_,
  zeroSequence,
} from "../../sequence.mjs";
import { makeBinding } from "./binding.mjs";

/**
 * @type {(
 *   entry: [string, import("../atom").ResExpression],
 * ) => import("../atom").ResExpression}
 */
const getValue = ([_key, val]) => val;

/**
 * @type {(
 *   pair: [string, import("../atom").ResExpression],
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const wrapKey = ([key, val]) => [makePrimitiveExpression(key), val];

/**
 * @type {(
 *   entry: [string, import("../atom").ResExpression],
 * ) => [
 *   import("../atom").ResExpression,
 *   import("../atom").ResExpression,
 * ]}
 */
const makeFrameEntry = ([key, val]) => [makePrimitiveExpression(key), val];

/**
 * @type {(
 *   record: Record<string, import("../atom").ResExpression>,
 * ) => import("../atom").ResExpression}
 */
export const makeRecordExpression = (record) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeIntrinsicExpression("undefined"),
    concat_X(
      makePrimitiveExpression(null),
      flatMap(listEntry(record), makeFrameEntry),
    ),
  );

/**
 * @type {(
 *   point: import("./point").Point<
 *     import("../atom").ResExpression,
 *     unknown,
 *   >,
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   [string, import("../atom").ResExpression][]
 * >}
 */
const listPointProperty = (point) => {
  switch (point.type) {
    case "block@enter": {
      return initSequence(
        [[FRAME_VARIABLE, point.frame]],
        [
          ["block", makeReadExpression(FRAME_VARIABLE)],
          ["record", makeRecordExpression(point.record)],
        ],
      );
    }
    case "block@completion": {
      return initSequence(
        [[FRAME_VARIABLE, point.frame]],
        [
          ["block", makeReadExpression(FRAME_VARIABLE)],
          ["value", point.value],
        ],
      );
    }
    case "block@failure": {
      return initSequence(
        [[FRAME_VARIABLE, point.frame]],
        [
          ["block", makeReadExpression(FRAME_VARIABLE)],
          ["value", point.value],
        ],
      );
    }
    case "block@leave": {
      return initSequence(
        [[FRAME_VARIABLE, point.frame]],
        [["block", makeReadExpression(FRAME_VARIABLE)]],
      );
    }
    case "return@before": {
      return zeroSequence([["value", point.value]]);
    }
    case "break@before": {
      return zeroSequence([["label", makePrimitiveExpression(point.label)]]);
    }
    case "debugger@before": {
      return zeroSequence(EMPTY);
    }
    case "debugger@after": {
      return zeroSequence(EMPTY);
    }
    case "branch@before": {
      return zeroSequence([
        ["kind", makePrimitiveExpression(point.kind)],
        ["value", point.value],
      ]);
    }
    case "branch@after": {
      return zeroSequence([["kind", makePrimitiveExpression(point.kind)]]);
    }
    case "primitive@after": {
      return zeroSequence([
        ["value", makePrimitiveExpression(packPrimitive(point.value))],
      ]);
    }
    case "intrinsic@after": {
      return zeroSequence([
        ["name", makePrimitiveExpression(point.name)],
        ["value", point.value],
      ]);
    }
    case "import@after": {
      return zeroSequence([
        ["source", makePrimitiveExpression(point.source)],
        ["specifier", makePrimitiveExpression(point.specifier)],
        ["value", point.value],
      ]);
    }
    case "closure@after": {
      return zeroSequence([
        ["kind", makePrimitiveExpression(point.kind)],
        ["asynchronous", makePrimitiveExpression(point.asynchronous)],
        ["generator", makePrimitiveExpression(point.generator)],
        ["value", point.value],
      ]);
    }
    case "read@after": {
      return zeroSequence([
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ]);
    }
    case "write@before": {
      return zeroSequence([
        ["variable", makePrimitiveExpression(point.variable)],
        ["value", point.value],
      ]);
    }
    case "drop@before": {
      return zeroSequence([["value", point.value]]);
    }
    case "export@before": {
      return zeroSequence([
        ["specifier", makePrimitiveExpression(point.specifier)],
        ["value", point.value],
      ]);
    }
    case "eval@before": {
      return zeroSequence([
        ["value", point.value],
        ["context", makeJsonExpression(point.context)],
      ]);
    }
    case "eval@after": {
      return zeroSequence([["value", point.value]]);
    }
    case "await@before": {
      return zeroSequence([["value", point.value]]);
    }
    case "await@after": {
      return zeroSequence([["value", point.value]]);
    }
    case "yield@before": {
      return zeroSequence([
        ["delegate", makePrimitiveExpression(point.delegate)],
        ["value", point.value],
      ]);
    }
    case "yield@after": {
      return zeroSequence([
        ["delegate", makePrimitiveExpression(point.delegate)],
        ["value", point.value],
      ]);
    }
    case "apply@around": {
      return zeroSequence([
        ["callee", point.callee],
        ["this", point.this],
        [
          "arguments",
          makeApplyExpression(
            makeIntrinsicExpression("Array.of"),
            makeIntrinsicExpression("undefined"),
            point.arguments,
          ),
        ],
      ]);
    }
    case "construct@around": {
      return zeroSequence([
        ["callee", point.callee],
        [
          "arguments",
          makeApplyExpression(
            makeIntrinsicExpression("Array.of"),
            makeIntrinsicExpression("undefined"),
            point.arguments,
          ),
        ],
      ]);
    }
    default: {
      throw new AranTypeError(point);
    }
  }
};

/**
 * @type {(
 *   point: import("./point").Point<
 *     import("../atom").ResExpression,
 *     import("../../json").Json,
 *   >,
 *   trail: import("./trail").Trail,
 *   advice: {
 *     kind: "object" | "function",
 *     variable: import("../../estree").Variable,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResExpression,
 * >}
 */
export const makeTriggerExpression = (point, trail, { kind }) => {
  const location_variable = mangleLocationVariable(trail);
  switch (kind) {
    case "function": {
      return liftSequence__X_(
        makeApplyExpression,
        makeReadExpression(ADVICE_VARIABLE),
        makeIntrinsicExpression("undefined"),
        liftSequenceX(
          concat_,
          liftSequence__X_(
            makeApplyExpression,
            makeIntrinsicExpression("aran.createObject"),
            makeIntrinsicExpression("undefined"),
            liftSequence_X(
              concat_X,
              makePrimitiveExpression(null),
              liftSequenceX_(
                flatMap,
                liftSequence_XX(
                  concat_X_,
                  pairup("type", makePrimitiveExpression(point.type)),
                  listPointProperty(point),
                  initSequence(
                    [makeBinding(location_variable, point.location)],
                    pairup("location", makeReadExpression(location_variable)),
                  ),
                ),
                wrapKey,
              ),
            ),
            null,
          ),
        ),
        null,
      );
    }
    case "object": {
      return liftSequence__X_(
        makeApplyExpression,
        makeApplyExpression(
          makeIntrinsicExpression("aran.get"),
          makeIntrinsicExpression("undefined"),
          [
            makeReadExpression(ADVICE_VARIABLE),
            makePrimitiveExpression(point.type),
          ],
        ),
        makeIntrinsicExpression("undefined"),
        liftSequenceXX(
          concatX_,
          liftSequenceX_(map, listPointProperty(point), getValue),
          initSequence(
            [makeBinding(location_variable, point.location)],
            makeReadExpression(location_variable),
          ),
        ),
        null,
      );
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};
