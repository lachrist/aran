import { AranTypeError } from "../../../error.mjs";
import { guard } from "../../../util/index.mjs";
import {
  makeReadCacheExpression,
  makeInitCacheExpression,
} from "../../cache.mjs";
import {
  makeThrowErrorExpression,
  makeLongSequenceExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import { splitMeta } from "../../mangle.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeExpressionEffect,
  makeConditionalExpression,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";
import { makeReadThisExpression } from "./this.mjs";

/**
 * @typedef {import("./closure.js").Closure} Closure
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     closure: Closure & { type: "method" | "constructor" },
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = ({ path }, context) => {
  switch (context.closure.type) {
    case "method": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(context.closure.proto, path)],
        path,
      );
    }
    case "constructor": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeGetExpression(
            makeReadCacheExpression(context.closure.self, path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
        ],
        path,
      );
    }
    default: {
      throw new AranTypeError(
        "invalid superable context.closure",
        context.closure,
      );
    }
  }
};

/**
 * @type {<C extends { closure: Closure }>(
 *   context: C,
 * ) => context is C & {
 *   closure: {
 *     type: "method" | "constructor",
 *   }
 * }}
 */
const isSuperableContext = (context) =>
  context.closure.type === "method" || context.closure.type === "constructor";

///////////////
// super.get //
///////////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   options: {
 *     key: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = ({ path }, context, { key }) => {
  if (isSuperableContext(context)) {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeSuperExpression({ path }, context),
        key,
        makeReadThisExpression({ path }, context),
      ],
      path,
    );
  } else if (context.closure.type === "none" && context.root.situ === "local") {
    return makeApplyExpression(
      makeReadParameterExpression("super.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [key],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' get", path);
  }
};

///////////////
// super.set //
///////////////

/**
 * @type {(
 *   site: {
 *     meta: unbuild.Meta,
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   options: {
 *     key: aran.Expression<unbuild.Atom>,
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetSuperEffect = ({ path, meta }, context, { key, value }) => {
  if (isSuperableContext(context)) {
    return [
      makeExpressionEffect(
        guard(
          context.mode === "strict",
          (node) =>
            makeConditionalExpression(
              node,
              makePrimitiveExpression({ undefined: null }, path),
              makeThrowErrorExpression(
                "TypeError",
                "Cannot set 'super' property",
                path,
              ),
              path,
            ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeSuperExpression({ path }, context),
              key,
              value,
              makeReadParameterExpression("this", path),
            ],
            path,
          ),
        ),
        path,
      ),
    ];
  } else {
    return [
      makeExpressionEffect(
        // eslint-disable-next-line no-use-before-define
        makeSetSuperExpression({ path, meta }, context, { key, value }),
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
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 *   options: {
 *     key: aran.Expression<unbuild.Atom>,
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetSuperExpression = (
  { path, meta },
  context,
  { key, value },
) => {
  if (isSuperableContext(context)) {
    const metas = splitMeta(meta, ["cache", "super"]);
    return makeInitCacheExpression(
      "constant",
      value,
      { path, meta: metas.cache },
      (value) =>
        makeLongSequenceExpression(
          listSetSuperEffect({ path, meta: metas.super }, context, {
            key,
            value: makeReadCacheExpression(value, path),
          }),
          makeReadCacheExpression(value, path),
          path,
        ),
    );
  } else if (context.closure.type === "none" && context.root.situ === "local") {
    return makeApplyExpression(
      makeReadParameterExpression("super.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [key, value],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' set", path);
  }
};
