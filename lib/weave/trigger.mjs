import { listEntry, map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import { packPrimitive } from "../lang.mjs";
import {
  bindVariable,
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
import { ADVICE_VARIABLE, mangleLocationVariable } from "./variable.mjs";

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
 *   frame: {
 *     [k in (aran.Parameter | import("../unbuild/variable").Variable)]
 *     ?: aran.Expression<weave.ResAtom>
 *   },
 * ) => aran.Expression<weave.ResAtom>}
 */
const makeFrameExpression = (frame) =>
  makeObjectExpression(
    makePrimitiveExpression(null),
    map(listEntry(frame), makeFrameEntry),
  );

/**
 * @type {<S extends Json>(
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     S
 *   >,
 * ) => [string, aran.Expression<weave.ResAtom>][]}
 */
const listPointProperty = (point) => {
  switch (point.type) {
    case "program.enter": {
      return [
        ["sort", makeJsonExpression(point.sort)],
        ["head", makeJsonExpression(point.head)],
        ["frame", makeFrameExpression(point.frame)],
      ];
    }
    case "program.completion": {
      return [
        ["sort", makeJsonExpression(point.sort)],
        ["value", point.value],
      ];
    }
    case "program.failure": {
      return [
        ["sort", makeJsonExpression(point.sort)],
        ["value", point.value],
      ];
    }
    case "program.leave": {
      return [["sort", makeJsonExpression(point.sort)]];
    }
    case "closure.enter": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["callee", point.callee],
        ["frame", makeFrameExpression(point.frame)],
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
        ["frame", makeFrameExpression(point.frame)],
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
    case "closure.after": {
      return [
        ["kind", makePrimitiveExpression(point.kind)],
        ["asynchronous", makePrimitiveExpression(point.asynchronous)],
        ["generator", makePrimitiveExpression(point.generator)],
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
        ["context", makeJsonExpression(point.context)],
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
    default: {
      throw new AranTypeError(point);
    }
  }
};

/**
 * @type {<S extends Json>(
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     S
 *   >,
 *   path: weave.TargetPath,
 *   advice: {
 *     kind: "object" | "function",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeTriggerExpression = (point, path, { kind }) => {
  switch (kind) {
    case "function": {
      return makeApplyExpression(
        makeReadExpression(ADVICE_VARIABLE),
        makeIntrinsicExpression("undefined"),
        [
          makeObjectExpression(
            makePrimitiveExpression(null),
            map(
              [
                ["type", makePrimitiveExpression(point.type)],
                ...listPointProperty(point),
                [
                  "location",
                  bindVariable(
                    makeReadExpression(mangleLocationVariable(path)),
                    [
                      mangleLocationVariable(path),
                      {
                        type: "json",
                        data: point.location,
                      },
                    ],
                  ),
                ],
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
          makeIntrinsicExpression("undefined"),
          [
            makeReadExpression(ADVICE_VARIABLE),
            makePrimitiveExpression(point.type),
          ],
        ),
        makeReadExpression(ADVICE_VARIABLE),
        [
          ...map(listPointProperty(point), getSecond),
          bindVariable(makeReadExpression(mangleLocationVariable(path)), [
            mangleLocationVariable(path),
            {
              type: "json",
              data: point.location,
            },
          ]),
        ],
      );
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};
