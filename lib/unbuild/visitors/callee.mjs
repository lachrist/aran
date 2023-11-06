import { drill } from "../../drill.mjs";
import { AranTypeError } from "../../util/error.mjs";
import { makeCacheExpression } from "../cache.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../node.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import {
  makeScopeGetSuperExpression,
  makeScopeCallSuperExpression,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeRegularCall = (callee, this_, arguments_, { path }) => {
  switch (arguments_.type) {
    case "spread": {
      return makeApplyExpression(callee, this_, arguments_.values, path);
    }
    case "concat": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.apply", path),
        makePrimitiveExpression({ undefined: null }, path),
        [callee, this_, arguments_.value],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid arguments", arguments_);
    }
  }
};

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeOptionalCall = (callee, this_, arguments_, { path, meta }) =>
  makeCacheExpression(callee, path, meta, (callee) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "==",
        callee,
        makePrimitiveExpression(null, path),
        path,
      ),
      makePrimitiveExpression({ undefined: null }, path),
      finalizeRegularCall(callee, this_, arguments_, { path }),
      path,
    ),
  );

/**
 * @type {(
 *   callee: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: {
 *     optional: boolean,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   }
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeCall = (callee, this_, arguments_, { optional, path, meta }) =>
  optional
    ? finalizeOptionalCall(callee, this_, arguments_, { path, meta })
    : finalizeRegularCall(callee, this_, arguments_, { path });

/**
 * @type {(
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const concatArgument = (arguments_, path) => {
  switch (arguments_.type) {
    case "spread": {
      return makeArrayExpression(arguments_.values, path);
    }
    case "concat": {
      return arguments_.value;
    }
    default: {
      throw new AranTypeError("invalid arguments", arguments_);
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     optional: boolean,
 *     arguments: {
 *       type: "spread",
 *       values: aran.Expression<unbuild.Atom>[],
 *     } | {
 *       type: "concat",
 *       value: aran.Expression<unbuild.Atom>,
 *     }
 *   },
 *  ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildCallee = (
  { node, path },
  context,
  { meta, optional, arguments: arguments_ },
) => {
  switch (node.type) {
    case "Super": {
      return makeScopeCallSuperExpression(
        context,
        concatArgument(arguments_, path),
        path,
      );
    }
    case "MemberExpression": {
      if (isNotSuperMemberExpression(node)) {
        const metas = splitMeta(meta, [
          "object",
          "object_cache",
          "key",
          "finalize",
        ]);
        return makeCacheExpression(
          unbuildExpression(drill({ node, path }, "object"), context, {
            name: ANONYMOUS,
            meta: metas.object,
          }),
          path,
          metas.object_cache,
          (object) =>
            finalizeCall(
              makeGetExpression(
                object,
                unbuildKeyExpression(
                  drill({ node, path }, "property"),
                  context,
                  {
                    computed: node.computed,
                    meta: metas.key,
                  },
                ),
                path,
              ),
              object,
              arguments_,
              { optional, path, meta: metas.finalize },
            ),
        );
      } else {
        const metas = splitMeta(meta, ["key", "finalize"]);
        return finalizeCall(
          makeScopeGetSuperExpression(
            context,
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              meta: metas.key,
              computed: node.computed,
            }),
            path,
          ),
          makeReadExpression("this", path),
          arguments_,
          { optional, path, meta: metas.finalize },
        );
      }
    }
    default: {
      const metas = splitMeta(meta, ["callee", "finalize"]);
      return finalizeCall(
        unbuildExpression({ node, path }, context, {
          meta: metas.callee,
          name: ANONYMOUS,
        }),
        makePrimitiveExpression({ undefined: null }, path),
        arguments_,
        {
          optional,
          path,
          meta: metas.finalize,
        },
      );
    }
  }
};
