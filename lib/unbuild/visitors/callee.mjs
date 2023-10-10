import { drill } from "../../drill.mjs";
import { StaticError } from "../../util/error.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
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
import { makeGetSuperExpression, makeCallSuperExpression } from "../record.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";

const BASENAME = /** @type {__basename} */ ("callee");

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
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeRegularCall = (callee, this_, arguments_) => {
  switch (arguments_.type) {
    case "spread":
      return makeApplyExpression(callee, this_, arguments_.values);
    case "concat":
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.apply"),
        makePrimitiveExpression({ undefined: null }),
        [callee, this_, arguments_.value],
      );
    default:
      throw new StaticError("invalid arguments", arguments_);
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
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeOptionalCall = (callee, this_, arguments_) =>
  makeSequenceExpression(
    makeWriteEffect(callee.var, callee.val, true),
    makeConditionalExpression(
      makeBinaryExpression(
        "==",
        makeReadExpression(callee.var),
        makePrimitiveExpression(null),
      ),
      makePrimitiveExpression({ undefined: null }),
      finalizeRegularCall(makeReadExpression(callee.var), this_, arguments_),
    ),
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
 * ) => aran.Expression<unbuild.Atom>}
 */
const finalizeCall = (callee, this_, arguments_, { optional }) =>
  optional
    ? finalizeOptionalCall(callee, this_, arguments_)
    : finalizeRegularCall(callee.val, this_, arguments_);

/**
 * @type {(
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const concatArgument = (arguments_) => {
  switch (arguments_.type) {
    case "spread":
      return makeArrayExpression(arguments_.values);
    case "concat":
      return arguments_.value;
    default:
      throw new StaticError("invalid arguments", arguments_);
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
 *  ) => aran.Expression<unbuild.Atom>
 * }
 */
export const unbuildCallee = ({ node, path }, context, options) => {
  const callee = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("callee"),
    path,
  );
  const this_ = mangleMetaVariable(
    BASENAME,
    /** @type {__unique} */ ("this_"),
    path,
  );
  switch (node.type) {
    case "Super":
      return makeCallSuperExpression(
        context,
        concatArgument(options.arguments),
        node,
      );
    case "MemberExpression": {
      if (isNotSuperMemberExpression(node)) {
        return makeSequenceExpression(
          makeWriteEffect(
            this_,
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            true,
          ),
          finalizeCall(
            {
              var: callee,
              val: node.optional
                ? makeConditionalExpression(
                    makeBinaryExpression(
                      "==",
                      makeReadExpression(this_),
                      makePrimitiveExpression(null),
                    ),
                    makePrimitiveExpression({ undefined: null }),
                    makeGetExpression(
                      makeReadExpression(this_),
                      unbuildKeyExpression(
                        drill({ node, path }, "property"),
                        context,
                        node,
                      ),
                    ),
                  )
                : makeGetExpression(
                    makeReadExpression(this_),
                    unbuildKeyExpression(
                      drill({ node, path }, "property"),
                      context,
                      node,
                    ),
                  ),
            },
            makeReadExpression(this_),
            options.arguments,
            options,
          ),
        );
      } else {
        return finalizeCall(
          {
            var: callee,
            val: makeGetSuperExpression(
              context,
              unbuildKeyExpression(
                drill({ node, path }, "property"),
                context,
                node,
              ),
              node,
            ),
          },
          makeReadExpression("this"),
          options.arguments,
          { optional: options.optional },
        );
      }
    }
    default:
      return finalizeCall(
        {
          var: callee,
          val: unbuildExpression({ node, path }, context, { name: ANONYMOUS }),
        },
        makePrimitiveExpression({ undefined: null }),
        options.arguments,
        options,
      );
  }
};
