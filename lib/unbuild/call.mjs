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
 *   hash: import("../hash").Hash,
 * ) => import("./atom").Expression}
 */
const concatArgument = (arguments_, hash) => {
  switch (arguments_.type) {
    case "spread": {
      return makeArrayExpression(arguments_.values, hash);
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
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
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
  hash,
  meta,
  scope,
  { callee, argument_list },
) => {
  switch (callee.type) {
    case "super": {
      return liftSequenceXX_(
        makeSequenceExpression,
        listScopeSaveEffect(hash, forkMeta((meta = nextMeta(meta))), scope, {
          type: "call-super",
          mode: getMode(scope),
          input: concatArgument(argument_list, hash),
        }),
        makeScopeLoadExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          {
            type: "read-this",
            mode: getMode(scope),
          },
        ),
        hash,
      );
    }
    case "eval": {
      switch (argument_list.type) {
        case "spread": {
          if (argument_list.values.length === 0) {
            return liftSequenceXX__(
              makeApplyExpression,
              makeScopeLoadExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                {
                  type: "read",
                  mode: getMode(scope),
                  variable:
                    /** @type {import("estree-sentry").VariableName} */ (
                      "eval"
                    ),
                },
              ),
              makeScopeLoadExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                {
                  type: "read-ambient-this",
                  mode: getMode(scope),
                  variable:
                    /** @type {import("estree-sentry").VariableName} */ (
                      "eval"
                    ),
                },
              ),
              [],
              hash,
            );
          } else {
            return incorporateExpression(
              bindSequence(
                flatSequence(
                  map(argument_list.values, (arg) =>
                    cacheConstant(forkMeta((meta = nextMeta(meta))), arg, hash),
                  ),
                ),
                (args) =>
                  liftSequenceXXX_(
                    makeConditionalExpression,
                    liftSequence_X__(
                      makeBinaryExpression,
                      "===",
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeIntrinsicExpression("eval", hash),
                      hash,
                    ),
                    initSequence(
                      [
                        makeRebootPrelude([
                          hash,
                          {
                            scope: packScope(scope),
                            meta: forkMeta((meta = nextMeta(meta))),
                          },
                        ]),
                      ],
                      makeEvalExpression(
                        makeReadCacheExpression(args[0], hash),
                        hash,
                      ),
                    ),
                    liftSequenceXX__(
                      makeApplyExpression,
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "read-ambient-this",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      map(args, (arg) => makeReadCacheExpression(arg, hash)),
                      hash,
                    ),
                    hash,
                  ),
              ),
              hash,
            );
          }
        }
        case "concat": {
          return incorporateExpression(
            bindSequence(
              cacheConstant(meta, concatArgument(argument_list, hash), hash),
              (input) =>
                liftSequenceXXX_(
                  makeConditionalExpression,
                  liftSequenceX___(
                    makeConditionalExpression,
                    liftSequence_X__(
                      makeBinaryExpression,
                      "===",
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeIntrinsicExpression("eval", hash),
                      hash,
                    ),
                    makeBinaryExpression(
                      "!==",
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.get", hash),
                        makeIntrinsicExpression("undefined", hash),
                        [
                          makeReadCacheExpression(input, hash),
                          makePrimitiveExpression("length", hash),
                        ],
                        hash,
                      ),
                      makePrimitiveExpression(0, hash),
                      hash,
                    ),
                    makePrimitiveExpression(false, hash),
                    hash,
                  ),
                  incorporateExpression(
                    bindSequence(
                      cacheConstant(
                        forkMeta((meta = nextMeta(meta))),
                        makeApplyExpression(
                          makeIntrinsicExpression("Reflect.get", hash),
                          makeIntrinsicExpression("undefined", hash),
                          [
                            makeReadCacheExpression(input, hash),
                            makePrimitiveExpression(0, hash),
                          ],
                          hash,
                        ),
                        hash,
                      ),
                      (code) =>
                        initSequence(
                          [
                            makeRebootPrelude([
                              hash,
                              {
                                scope: packScope(scope),
                                meta: forkMeta((meta = nextMeta(meta))),
                              },
                            ]),
                          ],
                          makeEvalExpression(
                            makeReadCacheExpression(code, hash),
                            hash,
                          ),
                        ),
                    ),
                    hash,
                  ),
                  liftSequence__X_(
                    makeApplyExpression,
                    makeIntrinsicExpression("Reflect.apply", hash),
                    makeIntrinsicExpression("undefined", hash),
                    liftSequenceXX_(
                      toArray,
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeScopeLoadExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          type: "read-ambient-this",
                          mode: getMode(scope),
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeReadCacheExpression(input, hash),
                    ),
                    hash,
                  ),
                  hash,
                ),
            ),
            hash,
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
              hash,
            ),
          );
        }
        case "concat": {
          return zeroSequence(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.apply", hash),
              makeIntrinsicExpression("undefined", hash),
              [callee.function, callee.this, argument_list.value],
              hash,
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
