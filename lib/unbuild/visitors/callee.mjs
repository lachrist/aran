import { drill } from "../../drill.mjs";
import { AranTypeError } from "../../util/error.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import { makeFragment, mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import {
  makeScopeGetSuperExpression,
  makeScopeCallSuperExpression,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/callee.mjs");

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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeRegularCall = (callee, this_, arguments_, path) => {
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
 *   callee: {
 *     var: unbuild.Variable,
 *     val: aran.Expression<unbuild.Atom>,
 *   },
 *   this_: aran.Expression<unbuild.Atom>,
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
const finalizeOptionalCall = (callee, this_, arguments_, path) =>
  makeSequenceExpression(
    makeWriteEffect(callee.var, callee.val, true, path),
    makeConditionalExpression(
      makeBinaryExpression(
        "==",
        makeReadExpression(callee.var, path),
        makePrimitiveExpression(null, path),
        path,
      ),
      makePrimitiveExpression({ undefined: null }, path),
      finalizeRegularCall(
        makeReadExpression(callee.var, path),
        this_,
        arguments_,
        path,
      ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   callee: {
 *     var: unbuild.Variable,
 *     val: aran.Expression<unbuild.Atom>,
 *   },
 *   this_: aran.Expression<unbuild.Atom>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 *   options: { optional: boolean },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeCall = (callee, this_, arguments_, { optional }, path) =>
  optional
    ? finalizeOptionalCall(callee, this_, arguments_, path)
    : finalizeRegularCall(callee.val, this_, arguments_, path);

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
export const unbuildCallee = ({ node, path }, context, options) => {
  const callee = mangleMetaVariable(
    path,
    makeFragment(LOCATION, /** @type {__unique} */ ("callee")),
  );
  const this_ = mangleMetaVariable(
    path,
    makeFragment(LOCATION, /** @type {__unique} */ ("this")),
  );
  switch (node.type) {
    case "Super": {
      return makeScopeCallSuperExpression(
        context,
        concatArgument(options.arguments, path),
        path,
      );
    }
    case "MemberExpression": {
      if (isNotSuperMemberExpression(node)) {
        return makeSequenceExpression(
          makeWriteEffect(
            this_,
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            true,
            path,
          ),
          finalizeCall(
            {
              var: callee,
              val: node.optional
                ? makeConditionalExpression(
                    makeBinaryExpression(
                      "==",
                      makeReadExpression(this_, path),
                      makePrimitiveExpression(null, path),
                      path,
                    ),
                    makePrimitiveExpression({ undefined: null }, path),
                    makeGetExpression(
                      makeReadExpression(this_, path),
                      unbuildKeyExpression(
                        drill({ node, path }, "property"),
                        context,
                        node,
                      ),
                      path,
                    ),
                    path,
                  )
                : makeGetExpression(
                    makeReadExpression(this_, path),
                    unbuildKeyExpression(
                      drill({ node, path }, "property"),
                      context,
                      node,
                    ),
                    path,
                  ),
            },
            makeReadExpression(this_, path),
            options.arguments,
            options,
            path,
          ),
          path,
        );
      } else {
        return finalizeCall(
          {
            var: callee,
            val: makeScopeGetSuperExpression(
              context,
              unbuildKeyExpression(
                drill({ node, path }, "property"),
                context,
                node,
              ),
              path,
            ),
          },
          makeReadExpression("this", path),
          options.arguments,
          { optional: options.optional },
          path,
        );
      }
    }
    default: {
      return finalizeCall(
        {
          var: callee,
          val: unbuildExpression({ node, path }, context, {
            name: ANONYMOUS,
          }),
        },
        makePrimitiveExpression({ undefined: null }, path),
        options.arguments,
        options,
        path,
      );
    }
  }
};
