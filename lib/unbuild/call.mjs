import { AranTypeError } from "../report.mjs";
import { map } from "../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeArrayExpression, makeBinaryExpression } from "./intrinsic.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeEvalExpression,
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
import {
  bindSequence,
  flatSequence,
  initSequence,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceXX__,
  liftSequenceX___,
  liftSequence_X__,
  liftSequence__X_,
  zeroSequence,
} from "../sequence.mjs";
import { makeRebootPrelude, incorporateExpression } from "./prelude/index.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   callee: import("./callee").Callee,
 *   argument_list: import("./argument").ArgumentList,
 * ) => import("./call").Call}
 */
export const makeCall = (callee, argument_list) => ({ callee, argument_list });

/**
 * @type {(
 *   arguments_: import("./argument").ArgumentList,
 *   path: import("../path").Path,
 * ) => import("./atom").Expression}
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
 *     callee: import("./callee").Callee,
 *     argument_list: import("./argument").ArgumentList,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").BodyPrelude,
 *   import("./atom").Expression,
 * >}
 */
export const makeCallExpression = (
  { path, meta },
  scope,
  { callee, argument_list },
) => {
  switch (callee.type) {
    case "super": {
      return liftSequenceXX_(
        makeSequenceExpression,
        listScopeSaveEffect(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          {
            type: "call-super",
            mode: getMode(scope),
            input: concatArgument(argument_list, path),
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
      );
    }
    case "eval": {
      switch (argument_list.type) {
        case "spread": {
          if (argument_list.values.length === 0) {
            return liftSequenceXX__(
              makeApplyExpression,
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "read",
                  mode: getMode(scope),
                  variable: /** @type {import("../estree").Variable} */ (
                    "eval"
                  ),
                },
              ),
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "read-ambient-this",
                  mode: getMode(scope),
                  variable: /** @type {import("../estree").Variable} */ (
                    "eval"
                  ),
                },
              ),
              [],
              path,
            );
          } else {
            return incorporateExpression(
              bindSequence(
                flatSequence(
                  map(argument_list.values, (arg) =>
                    cacheConstant(forkMeta((meta = nextMeta(meta))), arg, path),
                  ),
                ),
                (args) =>
                  liftSequenceXXX_(
                    makeConditionalExpression,
                    liftSequence_X__(
                      makeBinaryExpression,
                      /** @type {import("../estree").BinaryOperator}*/ ("==="),
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeIntrinsicExpression("eval", path),
                      path,
                    ),
                    initSequence(
                      [
                        makeRebootPrelude([
                          path,
                          {
                            scope: packScope(scope),
                            meta: forkMeta((meta = nextMeta(meta))),
                          },
                        ]),
                      ],
                      makeEvalExpression(
                        makeReadCacheExpression(args[0], path),
                        path,
                      ),
                    ),
                    liftSequenceXX__(
                      makeApplyExpression,
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read-ambient-this",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      map(args, (arg) => makeReadCacheExpression(arg, path)),
                      path,
                    ),
                    path,
                  ),
              ),
              path,
            );
          }
        }
        case "concat": {
          return incorporateExpression(
            bindSequence(
              cacheConstant(meta, concatArgument(argument_list, path), path),
              (input) =>
                liftSequenceXXX_(
                  makeConditionalExpression,
                  liftSequenceX___(
                    makeConditionalExpression,
                    liftSequence_X__(
                      makeBinaryExpression,
                      /** @type {import("../estree").BinaryOperator} */ ("==="),
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeIntrinsicExpression("eval", path),
                      path,
                    ),
                    makeBinaryExpression(
                      "!==",
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.get", path),
                        makeIntrinsicExpression("undefined", path),
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
                  incorporateExpression(
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
                        makeApplyExpression(
                          makeIntrinsicExpression("Reflect.get", path),
                          makeIntrinsicExpression("undefined", path),
                          [
                            makeReadCacheExpression(input, path),
                            makePrimitiveExpression(0, path),
                          ],
                          path,
                        ),
                        path,
                      ),
                      (code) =>
                        initSequence(
                          [
                            makeRebootPrelude([
                              path,
                              {
                                scope: packScope(scope),
                                meta: forkMeta((meta = nextMeta(meta))),
                              },
                            ]),
                          ],
                          makeEvalExpression(
                            makeReadCacheExpression(code, path),
                            path,
                          ),
                        ),
                    ),
                    path,
                  ),
                  liftSequence__X_(
                    makeApplyExpression,
                    makeIntrinsicExpression("Reflect.apply", path),
                    makeIntrinsicExpression("undefined", path),
                    liftSequenceXX_(
                      toArray,
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read-ambient-this",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeReadCacheExpression(input, path),
                    ),
                    path,
                  ),
                  path,
                ),
            ),
            path,
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
          return zeroSequence(
            makeApplyExpression(
              callee.function,
              callee.this,
              argument_list.values,
              path,
            ),
          );
        }
        case "concat": {
          return zeroSequence(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.apply", path),
              makeIntrinsicExpression("undefined", path),
              [callee.function, callee.this, argument_list.value],
              path,
            ),
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
