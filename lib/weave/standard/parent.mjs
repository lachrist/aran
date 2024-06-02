import { AranTypeError } from "../../error.mjs";
import {
  makeEffectStatement,
  makeWriteEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { makeClosureKind, makeProgramKind } from "../parametrization.mjs";
import { ADVICE_VARIABLE } from "../variable.mjs";

/**
 * @type {(
 *   parent: import("./parent").Parent,
 * ) => keyof import("../parametrization").Parametrization}
 */
export const makeParentKind = (parent) => {
  if (parent.type === "program") {
    return makeProgramKind(parent.node);
  } else if (parent.type === "closure") {
    return makeClosureKind(parent.node);
  } else {
    throw new AranTypeError(parent);
  }
};

/**
 * @type {(
 *   parent: import("./parent").Parent,
 * ) => import("../../json").Json}
 */
export const getParentHead = (parent) => {
  if (parent.type === "program") {
    return parent.node.head;
  } else if (parent.type === "closure") {
    return [];
  } else {
    throw new AranTypeError(parent);
  }
};

/**
 * @type {(
 *   parent: import("./parent").Parent,
 * ) => [
 *   import("../atom").ResVariable,
 *   import("../../lang").Intrinsic,
 * ][]}
 */
export const listParentPreludeBinding = (parent) => {
  if (parent.type === "program") {
    return [[ADVICE_VARIABLE, "undefined"]];
  } else if (parent.type === "closure") {
    return [];
  } else {
    throw new AranTypeError(parent);
  }
};

/**
 * @type {(
 *   parent: import("./parent").Parent,
 * ) => import("../atom").ResStatement[]}
 */
export const listParentPreludeStatement = (parent) => {
  if (parent.type === "program") {
    return [
      makeEffectStatement(
        makeWriteEffect(
          ADVICE_VARIABLE,
          makeApplyExpression(
            makeIntrinsicExpression("aran.get"),
            makeIntrinsicExpression("undefined"),
            [
              makeIntrinsicExpression("aran.global"),
              makePrimitiveExpression(parent.advice),
            ],
          ),
        ),
      ),
    ];
  } else if (parent.type === "closure") {
    return [];
  } else {
    throw new AranTypeError(parent);
  }
};
