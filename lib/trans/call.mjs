import { AranTypeError } from "../error.mjs";
import {
  concat___,
  flatenTree,
  map,
  bindSequence,
  flatSequence,
  liftSequenceX,
  liftSequenceXX_,
  liftSequenceXX__,
  liftSequenceX___,
  liftSequence_X__,
  liftSequence__X_,
  zeroSequence,
  liftSequenceX_X_,
} from "../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeUnaryExpression,
} from "./intrinsic.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "./node.mjs";
import { incorporateExpression } from "./prelude/index.mjs";
import {
  listCallSuperEffect,
  makeReadAmbientThisExpression,
  makeReadThisExpression,
  makeReadVariableExpression,
  packScope,
} from "./scope/index.mjs";

const {
  JSON: { stringify },
} = globalThis;

/**
 * @type {(
 *   callee: import("./callee.d.ts").Callee,
 *   argument_list: import("./argument.d.ts").ArgumentList,
 * ) => import("./call.d.ts").Call}
 */
export const makeCall = (callee, argument_list) => ({
  callee,
  argument_list,
});

/**
 * @type {(
 *   arguments_: import("./argument.d.ts").ArgumentList,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("./atom.d.ts").Expression}
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
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   scope: import("./scope/index.d.ts").Scope,
 *   code: import("./atom.d.ts").Expression,
 * ) => import("./atom.d.ts").Expression}
 */
const makeUnbuildEvalExpression = (hash, meta, scope, code) => {
  /** @type {import("./source.d.ts").DeepLocalSitu} */
  const situ = { type: "aran", scope: packScope(scope), meta };
  return makeEvalExpression(
    makeApplyExpression(
      makeIntrinsicExpression("aran.transpileEvalCode", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        code,
        makePrimitiveExpression(stringify(situ), hash),
        makePrimitiveExpression(hash, hash),
      ],
      hash,
    ),
    hash,
  );
};

/**
 * @type {(
 *   hash: import("./hash.d.ts").Hash,
 *   meta: import("./meta.d.ts").Meta,
 *   scope: import("./scope/index.d.ts").Scope,
 *   call: import("./call.d.ts").Call,
 * ) => import("../util/sequence.d.ts").Sequence<
 *   import("./prelude/index.d.ts").BodyPrelude,
 *   import("./atom.d.ts").Expression,
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
        liftSequenceX(
          flatenTree,
          listCallSuperEffect(hash, forkMeta((meta = nextMeta(meta))), scope, {
            input: concatArgument(argument_list, hash),
          }),
        ),
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
                  liftSequenceX_X_(
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
                        "===",
                        makeUnaryExpression(
                          "typeof",
                          makeReadCacheExpression(args[0], hash),
                          hash,
                        ),
                        makePrimitiveExpression("string", hash),
                        hash,
                      ),
                      makePrimitiveExpression(false, hash),
                      hash,
                    ),
                    makeUnbuildEvalExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      makeReadCacheExpression(args[0], hash),
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
              cacheConstant(meta, argument_list.value, hash),
              (input) =>
                liftSequenceX_X_(
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
                    makeConditionalExpression(
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
                      makeBinaryExpression(
                        "===",
                        makeUnaryExpression(
                          "typeof",
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
                        makePrimitiveExpression("string", hash),
                        hash,
                      ),
                      makePrimitiveExpression(false, hash),
                      hash,
                    ),
                    makePrimitiveExpression(false, hash),
                    hash,
                  ),
                  makeUnbuildEvalExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.get", hash),
                      makeIntrinsicExpression("undefined", hash),
                      [
                        makeReadCacheExpression(input, hash),
                        makePrimitiveExpression(0, hash),
                      ],
                      hash,
                    ),
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
