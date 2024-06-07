import { AranTypeError } from "../error.mjs";
import { EMPTY, concatX_, map } from "../util/index.mjs";
import { ROOT_DEPTH } from "./depth.mjs";
import { makeJsonExpression } from "./json.mjs";
import {
  makeEffectStatement,
  makeWriteEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { makeClosureKind, makeProgramKind } from "./parametrization.mjs";
import { mangleAdviceVariable, mangleStateVariable } from "./variable.mjs";

/**
 * @type {(
 *   routine: import("./routine").Routine,
 * ) => keyof import("./parametrization").Parametrization}
 */
export const makeRoutineKind = (routine) => {
  if (routine.type === "program") {
    return makeProgramKind(routine.node);
  } else if (routine.type === "closure") {
    return makeClosureKind(routine.node);
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {(
 *   routine: import("./routine").Routine,
 * ) => import("../json").Json}
 */
export const getRoutineHead = (routine) => {
  if (routine.type === "program") {
    return routine.node.head;
  } else if (routine.type === "closure") {
    return [];
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {(
 *   entry: [
 *     import("../estree").Variable,
 *     import("./rename").Rename,
 *   ],
 * ) => [
 *   import("./atom").ResVariable,
 *   import("../lang").Intrinsic,
 * ]}
 */
const makeAdviceBinding = ([_variable, rename]) => [
  mangleAdviceVariable(rename),
  "undefined",
];

/**
 * @type {(
 *   routine: import("./routine").Routine,
 * ) => [
 *   import("./atom").ResVariable,
 *   import("../lang").Intrinsic,
 * ][]}
 */
export const listRoutineBinding = (routine) => {
  if (routine.type === "program") {
    if (routine.node.situ === "global" || routine.node.situ === "local.root") {
      return concatX_(map(routine.renaming, makeAdviceBinding), [
        mangleStateVariable(ROOT_DEPTH),
        "undefined",
      ]);
    } else if (routine.node.situ === "local.deep") {
      return EMPTY;
    } else {
      throw new AranTypeError(routine.node);
    }
  } else if (routine.type === "closure") {
    return [];
  } else {
    throw new AranTypeError(routine);
  }
};

/**
 * @type {(
 *   entry: [
 *     import("../estree").Variable,
 *     import("./rename").Rename,
 *   ],
 * ) => import("./atom").ResStatement}
 */
const makeAdviceStatement = ([variable, rename]) =>
  makeEffectStatement(
    makeWriteEffect(
      mangleAdviceVariable(rename),
      makeApplyExpression(
        makeIntrinsicExpression("aran.get"),
        makeIntrinsicExpression("undefined"),
        [
          makeIntrinsicExpression("aran.global"),
          makePrimitiveExpression(variable),
        ],
      ),
    ),
  );

/**
 * @type {(
 *   routine: import("./routine").Routine,
 * ) => import("./atom").ResStatement[]}
 */
export const listRoutineStatement = (routine) => {
  if (routine.type === "program") {
    if (routine.node.situ === "global" || routine.node.situ === "local.root") {
      return [];
    } else if (routine.node.situ === "local.deep") {
      return concatX_(
        map(routine.renaming, makeAdviceStatement),
        makeEffectStatement(
          makeWriteEffect(
            mangleStateVariable(ROOT_DEPTH),
            makeJsonExpression(routine.initial),
          ),
        ),
      );
    } else {
      throw new AranTypeError(routine.node);
    }
  } else if (routine.type === "closure") {
    return [];
  } else {
    throw new AranTypeError(routine);
  }
};
