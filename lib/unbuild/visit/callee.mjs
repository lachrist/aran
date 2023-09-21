import { StaticError } from "../../util/error.mjs";
import { hasOwn } from "../../util/index.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
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
 *   node: estree.Expression | estree.Super,
 *   context: import("./context.d.ts").Context<S>,
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
export const unbuildCallee = (node, context, options) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "Super":
      return hasOwn(context.record, "super.constructor")
        ? finalizeCall(
            makeReadExpression(context.record["super.constructor"], serial),
            makePrimitiveExpression({ undefined: null }, serial),
            options.arguments,
            { serial, hash, optional: options.optional },
          )
        : makeApplyExpression(
            makeReadExpression("super.call", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [concatArgument(options.arguments, serial)],
            serial,
          );
    case "MemberExpression": {
      if (node.object.type === "Super") {
        return finalizeCall(
          hasOwn(context.record, "super")
            ? makeGetExpression(
                makeReadExpression(context.record.super, serial),
                unbuildKeyExpression(node.property, context, node),
                serial,
              )
            : makeApplyExpression(
                makeReadExpression("super.get", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [unbuildKeyExpression(node.property, context, node)],
                serial,
              ),
          makeReadExpression("this", serial),
          options.arguments,
          { serial, hash, optional: options.optional },
        );
      } else {
        const this_ = {
          var: mangleMetaVariable(hash, BASENAME, "this"),
          val: unbuildExpression(node.object, context, null),
        };
        return makeSequenceExpression(
          makeWriteEffect(this_.var, this_.val, serial, true),
          finalizeCall(
            node.optional
              ? makeConditionalExpression(
                  makeBinaryExpression(
                    "==",
                    makeReadExpression(this_.var, serial),
                    makePrimitiveExpression(null, serial),
                    serial,
                  ),
                  makePrimitiveExpression({ undefined: null }, serial),
                  makeGetExpression(
                    makeReadExpression(this_.var, serial),
                    unbuildKeyExpression(node.property, context, node),
                    serial,
                  ),
                  serial,
                )
              : makeGetExpression(
                  makeReadExpression(this_.var, serial),
                  unbuildKeyExpression(node.property, context, node),
                  serial,
                ),
            makeReadExpression(this_.var, serial),
            options.arguments,
            { serial, hash, optional: options.optional },
          ),
          serial,
        );
      }
    }
    default:
      return finalizeCall(
        unbuildExpression(node, context, null),
        makePrimitiveExpression({ undefined: null }, serial),
        options.arguments,
        { serial, hash, optional: options.optional },
      );
  }
};
