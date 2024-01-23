import { AranTypeError } from "../error.mjs";
import { map } from "../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeArrayExpression, makeBinaryExpression } from "./intrinsic.mjs";
import { forkMeta, nextMeta, packMeta } from "./meta.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "./node.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  packScope,
} from "./scope/index.mjs";
import { bindSequence, flatSequence, sequenceExpression } from "./sequence.mjs";

/**
 * @type {(
 *   arguments_: import("./visitors/argument").ArgumentList,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
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
      throw new AranTypeError(arguments_);
    }
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   scope: import("./scope").Scope,
 *   options: {
 *     callee: import("./visitors/callee").Callee,
 *     argument_list: import("./visitors/argument").ArgumentList,
 *   },
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeCallExpression = (
  { path, meta },
  scope,
  { callee, argument_list },
) => {
  switch (callee.type) {
    case "super": {
      return sequenceExpression(
        bindSequence(
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
      );
    }
    case "eval": {
      switch (argument_list.type) {
        case "spread": {
          if (argument_list.values.length === 0) {
            return makeApplyExpression(
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "read",
                  mode: getMode(scope),
                  variable: /** @type {estree.Variable} */ ("eval"),
                },
              ),
              makePrimitiveExpression({ undefined: null }, path),
              [],
              path,
            );
          } else {
            return bindSequence(
              flatSequence(
                map(argument_list.values, (arg) =>
                  cacheConstant(forkMeta((meta = nextMeta(meta))), arg, path),
                ),
              ),
              (args) =>
                makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        type: "read",
                        mode: getMode(scope),
                        variable: /** @type {estree.Variable} */ ("eval"),
                      },
                    ),
                    makeIntrinsicExpression("eval", path),
                    path,
                  ),
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    {
                      type: "eval",
                      mode: getMode(scope),
                      code: args[0],
                      context: {
                        type: "internal-local",
                        scope: packScope(scope),
                        meta: packMeta(forkMeta((meta = nextMeta(meta)))),
                      },
                    },
                  ),
                  makeApplyExpression(
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        type: "read",
                        mode: getMode(scope),
                        variable: /** @type {estree.Variable} */ ("eval"),
                      },
                    ),
                    makePrimitiveExpression({ undefined: null }, path),
                    map(args, (arg) => makeReadCacheExpression(arg, path)),
                    path,
                  ),
                  path,
                ),
            );
          }
        }
        case "concat": {
          return bindSequence(
            cacheConstant(meta, concatArgument(argument_list, path), path),
            (input) =>
              makeConditionalExpression(
                makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        type: "read",
                        mode: getMode(scope),
                        variable: /** @type {estree.Variable} */ ("eval"),
                      },
                    ),
                    makeIntrinsicExpression("eval", path),
                    path,
                  ),
                  makeBinaryExpression(
                    "!==",
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.get", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeReadCacheExpression(input, path),
                        makePrimitiveExpression("length", path),
                      ],
                      path,
                    ),
                    makePrimitiveExpression(0, path),
                    path,
                  ),
                  makePrimitiveExpression(false, path),
                  path,
                ),
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.get", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeReadCacheExpression(input, path),
                        makePrimitiveExpression(0, path),
                      ],
                      path,
                    ),
                    path,
                  ),
                  (code) =>
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        type: "eval",
                        mode: getMode(scope),
                        code,
                        context: {
                          type: "internal-local",
                          scope: packScope(scope),
                          meta: packMeta(forkMeta((meta = nextMeta(meta)))),
                        },
                      },
                    ),
                ),
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.apply", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        type: "read",
                        mode: getMode(scope),
                        variable: /** @type {estree.Variable} */ ("eval"),
                      },
                    ),
                    makePrimitiveExpression({ undefined: null }, path),
                    makeReadCacheExpression(input, path),
                  ],
                  path,
                ),
                path,
              ),
          );
        }
        default: {
          throw new AranTypeError(argument_list);
        }
      }
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
          throw new AranTypeError(argument_list);
        }
      }
    }
    default: {
      throw new AranTypeError(callee);
    }
  }
};
