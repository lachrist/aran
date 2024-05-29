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
 * @type {<L extends Json>(
 *   point: import("./point").Point<
 *     import("./atom").ResExpression,
 *     L,
 *   >,
 *   path: import("./atom").TargetPath,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: estree.Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("./atom").ResExpression,
 * >}
 */
export const makeTrapExpression = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return makeTriggerExpression(point, path, advice);
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
 * @type {<L extends Json>(
 *   point: import("./point").Point<
 *     import("./atom").ResExpression,
 *     L,
 *   >,
 *   path: import("./atom").TargetPath,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: estree.Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("./atom").ResEffect[],
 * >}
 */
export const listTrapEffect = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return liftSequenceX(
      concat_,
      liftSequenceX(
        makeExpressionEffect,
        makeTriggerExpression(point, path, advice),
      ),
    );
  } else {
    return EMPTY_SEQUENCE;
  }
};

/**
 * @type {<L extends Json>(
 *   point: import("./point").Point<
 *     import("./atom").ResExpression,
 *     L,
 *   >,
 *   path: import("./atom").TargetPath,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: estree.Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   null | import("./atom").ResExpression,
 * >}
 */
export const makeMaybeTrapExpression = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return makeTriggerExpression(point, path, advice);
  } else {
    return zeroSequence(null);
  }
};

/**
 * @type {<L extends Json>(
 *   point: import("./point").Point<
 *     import("./atom").ResExpression,
 *     L,
 *   > & { type: "block.enter" },
 *   path: import("./atom").TargetPath,
 *   options: {
 *     pointcut: import("./pointcut").Pointcut<L>,
 *     advice: {
 *       kind: "object" | "function",
 *       variable: estree.Variable,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("./binding").Binding,
 *   import("./atom").ResEffect[],
 * >}
 */
export const listRecordTrapEffect = (point, path, { pointcut, advice }) => {
  if (cut(point, pointcut)) {
    return logSequence(
      pairup(RECORD_VARIABLE, undefined),
      liftSequenceX_(
        concat_X,
        liftSequence_X(
          makeWriteEffect,
          RECORD_VARIABLE,
          makeTriggerExpression(point, path, advice),
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

// /**
//  * @type {<S extends Json>(
//  *   point: import("../../type/advice").Point<
//  *     import("./atom").ResExpression,
//  *     S
//  *   >,
//  *   path: weave.TargetPath,
//  *   options: {
//  *     pointcut: import("../../type/advice").Pointcut<S>,
//  *     advice: {
//  *       variable: estree.Variable,
//  *       kind: "object" | "function",
//  *     },
//  *   },
//  * ) => import("../sequence").Sequence<
//  *   import("./binding").Binding,
//  *   aran.Effect<weave.ResAtom>[],
//  * >}
//  */
// export const listTrapEffect = (point, path, { pointcut, advice }) =>
//   cut(point, pointcut)
//     ? [makeExpressionEffect(makeTriggerExpression(point, path, advice))]
//     : [];

// /**
//  * @type {<S extends Json>(
//  *   point: import("../../type/advice").Point<
//  *     import("./atom").ResExpression,
//  *     S
//  *   > & {
//  *     type: "closure.enter" | "program.enter" | "block.enter",
//  *   },
//  *   path: weave.TargetPath,
//  *   options: {
//  *     pointcut: import("../../type/advice").Pointcut<S>,
//  *     advice: {
//  *       variable: estree.Variable,
//  *       kind: "object" | "function",
//  *     },
//  *   },
//  * ) => import("../sequence").Sequence<
//  *   import("./binding").Binding,
//  *   aran.Effect<weave.ResAtom>[],
//  * >}
//  */
// export const listEnterTrapEffect = (point, path, { pointcut, advice }) => {
//   if (cut(point, pointcut)) {
//     const variables = listKey(point.frame);
//     const frame = makeTriggerExpression(point, path, advice);
//     if (variables.length === 0) {
//       return [makeExpressionEffect(frame)];
//     } else if (variables.length === 1) {
//       const variable = variables[0];
//       return [
//         makeWriteEffect(
//           isParameter(variable) ? variable : mangleOriginalVariable(variable),
//           makeGetExpression(frame, makePrimitiveExpression(variables[0])),
//         ),
//       ];
//     } else {
//       return [
//         bindVariable(makeWriteEffect(FRAME_VARIABLE, frame), [
//           FRAME_VARIABLE,
//           { type: "intrinsic", name: "aran.deadzone" },
//         ]),
//         ...map(variables, (variable) =>
//           makeWriteEffect(
//             isParameter(variable) ? variable : mangleOriginalVariable(variable),
//             makeGetExpression(
//               makeReadExpression(FRAME_VARIABLE),
//               makePrimitiveExpression(variable),
//             ),
//           ),
//         ),
//       ];
//     }
//   } else {
//     return [];
//   }
// };

// /**
//  * @type {<S extends Json>(
//  *   input: {
//  *     body: aran.Statement<weave.ResAtom>[],
//  *     completion: import("./atom").ResExpression,
//  *   },
//  *   points:{
//  *     catch: import("../../type/advice").Point<
//  *       import("./atom").ResExpression,
//  *       S
//  *     >,
//  *     finally: import("../../type/advice").Point<
//  *       import("./atom").ResExpression,
//  *       S
//  *     >,
//  *   },
//  *   path: weave.TargetPath,
//  *   options: {
//  *     pointcut: import("../../type/advice").Pointcut<S>,
//  *     advice: {
//  *       variable: estree.Variable,
//  *       kind: "object" | "function",
//  *     },
//  *   },
//  * ) => {
//  *   body: aran.Statement<weave.ResAtom>[],
//  *   completion: import("./atom").ResExpression,
//  * }}
//  */
// export const trapClosureBlock = (input, points, path, { pointcut, advice }) => {
//   const triggered = {
//     catch: cut(points.catch, pointcut),
//     finally: cut(points.finally, pointcut),
//   };
//   if (triggered.catch || triggered.finally) {
//     return {
//       body: [
//         makeTryStatement(
//           makeControlBlock(
//             [],
//             [],
//             [
//               ...input.body,
//               makeEffectStatement(
//                 makeWriteEffect(COMPLETION_VARIABLE, input.completion),
//               ),
//             ],
//           ),
//           makeControlBlock(
//             [],
//             [],
//             [
//               makeEffectStatement(
//                 makeExpressionEffect(
//                   makeApplyExpression(
//                     makeIntrinsicExpression("aran.throw"),
//                     makeIntrinsicExpression("undefined"),
//                     [
//                       triggered.catch
//                         ? makeTriggerExpression(points.catch, path, advice)
//                         : makeReadExpression("catch.error"),
//                     ],
//                   ),
//                 ),
//               ),
//             ],
//           ),
//           makeControlBlock(
//             [],
//             [],
//             triggered.finally
//               ? [
//                   makeEffectStatement(
//                     makeExpressionEffect(
//                       makeTriggerExpression(points.finally, path, advice),
//                     ),
//                   ),
//                 ]
//               : [],
//           ),
//         ),
//       ],
//       completion: bindVariable(makeReadExpression(COMPLETION_VARIABLE), [
//         COMPLETION_VARIABLE,
//         { type: "intrinsic", name: "aran.deadzone" },
//       ]),
//     };
//   } else {
//     return input;
//   }
// };

// /**
//  * @type {<S extends Json>(
//  *   statements: aran.Statement<weave.ResAtom>[],
//  *   points: {
//  *     catch: import("../../type/advice").Point<
//  *       import("./atom").ResExpression,
//  *       S
//  *     >,
//  *     finally: import("../../type/advice").Point<
//  *       import("./atom").ResExpression,
//  *       S
//  *     >,
//  *   },
//  *   path: weave.TargetPath,
//  *   options: {
//  *     pointcut: import("../../type/advice").Pointcut<S>,
//  *     advice: {
//  *       variable: estree.Variable,
//  *       kind: "object" | "function",
//  *     },
//  *   },
//  * ) => aran.Statement<weave.ResAtom>[]}
//  */
// export const trapControlBlock = (
//   statements,
//   points,
//   path,
//   { pointcut, advice },
// ) => {
//   const triggered = {
//     catch: cut(points.catch, pointcut),
//     finally: cut(points.finally, pointcut),
//   };
//   if (triggered.catch || triggered.finally) {
//     return [
//       makeTryStatement(
//         makeControlBlock([], [], statements),
//         makeControlBlock(
//           [],
//           [],
//           [
//             makeEffectStatement(
//               makeExpressionEffect(
//                 makeApplyExpression(
//                   makeIntrinsicExpression("aran.throw"),
//                   makeIntrinsicExpression("undefined"),
//                   [
//                     triggered.catch
//                       ? makeTriggerExpression(points.catch, path, advice)
//                       : makeReadExpression("catch.error"),
//                   ],
//                 ),
//               ),
//             ),
//           ],
//         ),
//         makeControlBlock(
//           [],
//           [],
//           triggered.finally
//             ? [
//                 makeEffectStatement(
//                   makeExpressionEffect(
//                     makeTriggerExpression(points.finally, path, advice),
//                   ),
//                 ),
//               ]
//             : [],
//         ),
//       ),
//     ];
//   } else {
//     return statements;
//   }
// };
