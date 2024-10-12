import { AranTypeError } from "../report.mjs";
import { concat___, map } from "../util/index.mjs";
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
import {
  listCallSuperEffect,
  makeReadAmbientThisExpression,
  makeReadThisExpression,
  makeReadVariableExpression,
} from "./scope/index.mjs";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   callee: import("./callee").Callee,
 *   argument_list: import("./argument").ArgumentList,
 * ) => import("./call").Call}
 */
export const makeCall = (mode, callee, argument_list) => ({
  mode,
  callee,
  argument_list,
});

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
 *   call: import("./call").Call,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").BodyPrelude,
 *   import("./atom").Expression,
 * >}
 */
export const makeCallExpression = (
  hash,
  meta,
  scope,
  { mode, callee, argument_list },
) => {
  switch (callee.type) {
    case "super": {
      return liftSequenceXX_(
        makeSequenceExpression,
        listCallSuperEffect(hash, forkMeta((meta = nextMeta(meta))), scope, {
          input: concatArgument(argument_list, hash),
        }),
        makeReadThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          {},
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
              makeReadVariableExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                {
                  variable:
                    /** @type {import("estree-sentry").VariableName} */ (
                      "eval"
                    ),
                },
              ),
              makeReadAmbientThisExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                {
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
                      makeReadVariableExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
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
                            mode,
                            meta: forkMeta((meta = nextMeta(meta))),
                            scope,
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
                      makeReadVariableExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeReadAmbientThisExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
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
                      makeReadVariableExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
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
                                mode,
                                meta: forkMeta((meta = nextMeta(meta))),
                                scope,
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
                      concat___,
                      makeReadVariableExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeReadAmbientThisExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
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
