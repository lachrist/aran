import { AranTypeError } from "../error.mjs";
import { makeArrayExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { makeCallSuperExpression } from "./param/index.mjs";

/**
 * @type {(
 *   arguments_: import("./visitors/argument.d.ts").ArgumentList,
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
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("./context.d.ts").Context,
 *   options: {
 *     callee: import("./visitors/callee.d.ts").Callee,
 *     argument_list: import("./visitors/argument.d.ts").ArgumentList,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallExpression = (
  { path, meta },
  context,
  { callee, argument_list },
) => {
  switch (callee.type) {
    case "super": {
      return makeCallSuperExpression({ path, meta }, context, {
        input: concatArgument(argument_list, path),
      });
    }
    case "normal": {
      switch (argument_list.type) {
        case "spread": {
          return makeApplyExpression(
            callee.function,
            callee.this,
            argument_list.values,
            path,
          );
        }
        case "concat": {
          return makeApplyExpression(
            makeIntrinsicExpression("Reflect.apply", path),
            makePrimitiveExpression({ undefined: null }, path),
            [callee.function, callee.this, argument_list.value],
            path,
          );
        }
        default: {
          throw new AranTypeError("invalid argument_list", argument_list);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid callee", callee);
    }
  }
};
