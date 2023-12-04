import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { makeReadNewTargetExpression } from "./new-target.mjs";
import {
  listInitializeThisEffect,
  makeInitializeThisExpression,
} from "./this.mjs";

/**
 * @type {<C extends {
 *   closure: import("./closure").Closure
 * }>(
 *   context: C,
 * ) => context is C & {
 *   closure: {
 *     type: "constructor",
 *     derived: true,
 *   },
 * }}
 */
const isDerivedConstructorContext = (context) =>
  context.closure.type === "constructor" && context.closure.derived;

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     closure: import("./closure").Closure & {
 *       type: "constructor",
 *     },
 *     root: {
 *       situ: "global" | "local",
 *     },
 *   },
 *   options: {
 *     input: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeConstructSuperExpression = ({ path }, context, { input }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.construct", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(context.closure.self, path)],
        path,
      ),
      input,
      makeReadNewTargetExpression({ path }, context),
    ],
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: import("./closure").Closure,
 *   },
 *   options: {
 *     input: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listCallSuperEffect = ({ path, meta }, context, { input }) => {
  if (isDerivedConstructorContext(context)) {
    return listInitializeThisEffect({ path, meta }, context, {
      right: makeConstructSuperExpression({ path }, context, { input }),
    });
  } else if (context.closure.type === "none" && context.root.situ === "local") {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeReadParameterExpression("super.call", path),
          makePrimitiveExpression({ undefined: null }, path),
          [input],
          path,
        ),
        path,
      ),
    ];
  } else {
    return [
      makeExpressionEffect(
        makeSyntaxErrorExpression("Illegal 'super' call", path),
        path,
      ),
    ];
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: import("./closure").Closure,
 *   },
 *   options: {
 *     input: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = ({ path, meta }, context, { input }) => {
  if (isDerivedConstructorContext(context)) {
    return makeInitializeThisExpression({ path, meta }, context, {
      right: makeConstructSuperExpression({ path }, context, { input }),
    });
  } else if (context.closure.type === "none" && context.root.situ === "local") {
    return makeApplyExpression(
      makeReadParameterExpression("super.call", path),
      makePrimitiveExpression({ undefined: null }, path),
      [input],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' call", path);
  }
};
