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

const BASENAME = /** @basename */ "callee";

/**
 * @type {<S>(
 *   callee: aran.Expression<unbuild.Atom<S>>,
 *   this_: aran.Expression<unbuild.Atom<S>>,
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom<S>>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom<S>>,
 *   },
 *   optional: {
 *     optional: boolean,
 *     hash: unbuild.Hash,
 *     serial: S,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const finalizeCall = (
  callee_val,
  this_,
  arguments_,
  { optional, hash, serial },
) => {
  if (optional) {
    const callee_var = mangleMetaVariable(hash, BASENAME, "callee");
    return makeSequenceExpression(
      makeWriteEffect(callee_var, callee_val, serial, true),
      makeConditionalExpression(
        makeBinaryExpression(
          "==",
          makeReadExpression(callee_var, serial),
          makePrimitiveExpression(null, serial),
          serial,
        ),
        makePrimitiveExpression({ undefined: null }, serial),
        finalizeCall(
          makeReadExpression(callee_var, serial),
          this_,
          arguments_,
          { optional: false, serial, hash },
        ),
        serial,
      ),
      serial,
    );
  } else {
    switch (arguments_.type) {
      case "spread":
        return makeApplyExpression(
          callee_val,
          this_,
          arguments_.values,
          serial,
        );
      case "concat":
        return makeApplyExpression(
          makeIntrinsicExpression("Reflect.apply", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [callee_val, this_, arguments_.value],
          serial,
        );
      default:
        throw new StaticError("invalid arguments", arguments_);
    }
  }
};

/**
 * @type {<S>(
 *   arguments_: {
 *     type: "spread",
 *     values: aran.Expression<unbuild.Atom<S>>[],
 *   } | {
 *     type: "concat",
 *     value: aran.Expression<unbuild.Atom<S>>,
 *   },
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const concatArgument = (arguments_, serial) => {
  switch (arguments_.type) {
    case "spread":
      return makeArrayExpression(arguments_.values, serial);
    case "concat":
      return arguments_.value;
    default:
      throw new StaticError("invalid arguments", arguments_);
  }
};

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     optional: boolean,
 *     arguments: {
 *       type: "spread",
 *       values: aran.Expression<unbuild.Atom<S>>[],
 *     } | {
 *       type: "concat",
 *       value: aran.Expression<unbuild.Atom<S>>,
 *     }
 *   },
 *  ) => aran.Expression<unbuild.Atom<S>>
 * }
 */
export const unbuildCallee = ({ node, path }, context, options) => {
  const { serialize, digest } = context;
  const serial = serialize(node, path);
  const hash = digest(node, path);
  switch (node.type) {
    case "Super":
      return makeCallSuperExpression(
        context,
        concatArgument(options.arguments, serial),
        { serial, origin: node },
      );
    case "MemberExpression": {
      if (isNotSuperMemberExpression(node)) {
        const this_ = mangleMetaVariable(hash, BASENAME, "this");
        return makeSequenceExpression(
          makeWriteEffect(
            this_,
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            serial,
            true,
          ),
          finalizeCall(
            node.optional
              ? makeConditionalExpression(
                  makeBinaryExpression(
                    "==",
                    makeReadExpression(this_, serial),
                    makePrimitiveExpression(null, serial),
                    serial,
                  ),
                  makePrimitiveExpression({ undefined: null }, serial),
                  makeGetExpression(
                    makeReadExpression(this_, serial),
                    unbuildKeyExpression(
                      drill({ node, path }, "property"),
                      context,
                      node,
                    ),
                    serial,
                  ),
                  serial,
                )
              : makeGetExpression(
                  makeReadExpression(this_, serial),
                  unbuildKeyExpression(
                    drill({ node, path }, "property"),
                    context,
                    node,
                  ),
                  serial,
                ),
            makeReadExpression(this_, serial),
            options.arguments,
            { serial, hash, optional: options.optional },
          ),
          serial,
        );
      } else {
        return finalizeCall(
          makeGetSuperExpression(
            context,
            unbuildKeyExpression(
              drill({ node, path }, "property"),
              context,
              node,
            ),
            { serial, origin: node },
          ),
          makeReadExpression("this", serial),
          options.arguments,
          { serial, hash, optional: options.optional },
        );
      }
    }
    default:
      return finalizeCall(
        unbuildExpression({ node, path }, context, { name: ANONYMOUS }),
        makePrimitiveExpression({ undefined: null }, serial),
        options.arguments,
        { serial, hash, optional: options.optional },
      );
  }
};
