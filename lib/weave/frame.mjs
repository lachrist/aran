import { makeIntrinsicExpression, makeReadExpression } from "./node.mjs";
import { reduceEntry, map } from "../util/index.mjs";
import { mangleOriginalVariable } from "./variable.mjs";

// /**
//  * @type {(
//  *   code: string,
//  * ) => aran.Expression<weave.ResAtom>}
//  */
// const prepare = (code) =>
//   makeApplyExpression(
//     makeClosureExpression(
//       "arrow",
//       false,
//       false,
//       makeClosureBlock(
//         [],
//         [
//           makeTryStatement(
//             makeControlBlock(
//               [],
//               [],
//               [
//                 makeReturnStatement(
//                   makeEvalExpression(makePrimitiveExpression(code)),
//                 ),
//               ],
//             ),
//             makeControlBlock(
//               [],
//               [],
//               [makeReturnStatement(makeIntrinsicExpression("undefined"))],
//             ),
//             makeControlBlock([], [], []),
//           ),
//         ],
//         makeIntrinsicExpression("undefined"),
//       ),
//     ),
//     makeIntrinsicExpression("undefined"),
//     [],
//   );

// const precomp = {
//   "import.meta": prepare("(import.meta);"),
//   "new.target": prepare("(new.target);"),
//   "super.get": prepare("((key) => super[key]);"),
//   "super.set": prepare("((key, val) => super[key] = val);"),
//   "super.call": prepare("((...args) => super(...args));"),
// };

// /**
//  * @type {(
//  *   root: aran.Program<weave.ArgAtom>,
//  * ) => aran.Expression<weave.ResAtom>}
//  */
// export const makeProgramFrame = (root) => {
//   const dynamic = hasDirectEvalCall(root);
// };

/**
 * @type {(
 *   entry: [
 *     import("./atom").ArgVariable,
 *     aran.Intrinsic,
 *   ],
 * ) => [
 *   import("./atom").ResVariable,
 *   import("./atom").ResExpression,
 * ]}
 */
const prepareBinding = ([variable, intrinsic]) => [
  mangleOriginalVariable(variable),
  makeIntrinsicExpression(intrinsic),
];

/**
 * @type {(
 *   kind: import("./frame").ControlFrame["kind"],
 *   labels: import("./atom").Label[],
 *   bindings: [
 *     import("./atom").ArgVariable,
 *     aran.Intrinsic,
 *   ][],
 * ) => import("./frame").ControlFrame}
 */
export const makeControlFrame = (kind, labels, bindings) => {
  if (kind === "catch") {
    return {
      type: "control",
      kind,
      labels,
      record: {
        "catch.error": makeReadExpression("catch.error"),
        ...reduceEntry(map(bindings, prepareBinding)),
      },
    };
  } else {
    return {
      type: "control",
      kind,
      labels,
      record: reduceEntry(map(bindings, prepareBinding)),
    };
  }
};
