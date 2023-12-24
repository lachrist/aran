import { AranTypeError } from "../error.mjs";
import { cacheConstant } from "./cache.mjs";
import { makeArrayExpression } from "./intrinsic.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "./node.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "./scope/index.mjs";
import { mapSequence, sequenceExpression } from "./sequence.mjs";

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
 *   site: import("./site.js").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     callee: import("./visitors/callee.d.ts").Callee,
 *     argument_list: import("./visitors/argument.d.ts").ArgumentList,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallExpression = (
  { path, meta },
  scope,
  { callee, argument_list },
) => {
  switch (callee.type) {
    case "super": {
      return sequenceExpression(
        mapSequence(
          cacheConstant(meta, concatArgument(argument_list, path), path),
          (input) =>
            makeSequenceExpression(
              listScopeSaveEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "call-super",
                  mode: getMode(scope),
                  input,
                },
              ),
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "read-this",
                  mode: getMode(scope),
                },
              ),
              path,
            ),
        ),
        path,
      );
    }
    case "regular": {
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
