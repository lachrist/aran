import { isParameter, packPrimitive } from "../../lang.mjs";
import { cut } from "./cut.mjs";
import {
  makeApplyExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeWriteEffect,
  makeReadExpression,
} from "./node.mjs";
import { makeRecordExpression, makeTriggerExpression } from "./trigger.mjs";
import {
  EMPTY_SEQUENCE,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X,
  logSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { concat_, concat_X, listKey, map, pairup } from "../../util/index.mjs";
import { RECORD_VARIABLE, mangleOriginalVariable } from "./variable.mjs";

const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;

/**
 * @type {<L extends import("../../json").Json>(
 *   point: import("./point").Point<
 *     import("../atom").ResExpression,
 *     L,
 *   >,
 *   trail: import("./trail").Trail,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: import("../../estree").Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResExpression,
 * >}
 */
export const makeTrapExpression = (point, trail, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return makeTriggerExpression(point, trail, advice);
  } else {
    if (point.type === "apply") {
      return zeroSequence(
        makeApplyExpression(point.callee, point.this, point.arguments),
      );
    } else if (point.type === "construct") {
      return zeroSequence(
        makeConstructExpression(point.callee, point.arguments),
      );
    } else if (point.type === "block.enter") {
      return zeroSequence(makeRecordExpression(point.record));
    } else if (point.type === "primitive.after") {
      return zeroSequence(makePrimitiveExpression(packPrimitive(point.value)));
    } else if (getOwnPropertyDescriptor(point, "value") && "value" in point) {
      return zeroSequence(point.value);
    } else {
      return zeroSequence(makeIntrinsicExpression("undefined"));
    }
  }
};

/**
 * @type {<L extends import("../../json").Json>(
 *   point: import("./point").Point<
 *     import("../atom").ResExpression,
 *     L,
 *   >,
 *   trail: import("./trail").Trail,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: import("../../estree").Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResEffect[],
 * >}
 */
export const listTrapEffect = (point, trail, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return liftSequenceX(
      concat_,
      liftSequenceX(
        makeExpressionEffect,
        makeTriggerExpression(point, trail, advice),
      ),
    );
  } else {
    return EMPTY_SEQUENCE;
  }
};

/**
 * @type {<L extends import("../../json").Json>(
 *   point: import("./point").Point<
 *     import("../atom").ResExpression,
 *     L,
 *   >,
 *   trail: import("./trail").Trail,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: import("../../estree").Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   null | import("../atom").ResExpression,
 * >}
 */
export const makeMaybeTrapExpression = (point, trail, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return makeTriggerExpression(point, trail, advice);
  } else {
    return zeroSequence(null);
  }
};

/**
 * @type {<L extends import("../../json").Json>(
 *   point: import("./point").Point<
 *     import("../atom").ResExpression,
 *     L,
 *   > & { type: "block.enter" },
 *   trail: import("./trail").Trail,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: import("../../estree").Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("../atom").ResEffect[],
 * >}
 */
export const listRecordTrapEffect = (point, trail, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return logSequence(
      pairup(RECORD_VARIABLE, undefined),
      liftSequenceX_(
        concat_X,
        liftSequence_X(
          makeWriteEffect,
          RECORD_VARIABLE,
          makeTriggerExpression(point, trail, advice),
        ),
        map(listKey(point.record), (variable) =>
          makeWriteEffect(
            isParameter(variable) ? variable : mangleOriginalVariable(variable),
            makeApplyExpression(
              makeIntrinsicExpression("aran.get"),
              makeIntrinsicExpression("undefined"),
              [
                makeReadExpression(RECORD_VARIABLE),
                makePrimitiveExpression(variable),
              ],
            ),
          ),
        ),
      ),
    );
  } else {
    return EMPTY_SEQUENCE;
  }
};
