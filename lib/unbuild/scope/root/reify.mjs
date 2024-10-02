import { AranExecError, AranTypeError } from "../../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X__,
  mapSequence,
  thenSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../error.mjs";
import {
  makePrefixPrelude,
  incorporateEffect,
  incorporateExpression,
  makeReifyExternalPrelude,
} from "../../prelude/index.mjs";
import { EMPTY, concat_ } from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../atom").Expression}
 */
export const makeRecordBelongExpression = (hash, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.record", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("../../atom").Expression}
 */
const makeGlobalBelongExpression = (hash, { variable }) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.has", hash),
    makeIntrinsicExpression("undefined", hash),
    [
      makeIntrinsicExpression("aran.global", hash),
      makePrimitiveExpression(variable, hash),
    ],
    hash,
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   write: "unknown" | "report" | "perform",
 *   operation: import("../operation").WriteOperation,
 * ) => import("../../atom").Expression}
 */
const makeRecordAliveWriteExpression = (hash, write, operation) => {
  switch (write) {
    case "unknown": {
      return makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.set", hash),
          makeIntrinsicExpression("undefined", hash),
          [
            makeIntrinsicExpression("aran.record", hash),
            makePrimitiveExpression(operation.variable, hash),
            operation.right,
          ],
          hash,
        ),
        makePrimitiveExpression(true, hash),
        makeThrowConstantExpression(operation.variable, hash),
        hash,
      );
    }
    case "perform": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.record", hash),
          makePrimitiveExpression(operation.variable, hash),
          operation.right,
        ],
        hash,
      );
    }
    case "report": {
      return makeThrowConstantExpression(operation.variable, hash);
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {(
 *   write: "report" | "perform",
 * ) => boolean}
 */
const toWritable = (write) => {
  switch (write) {
    case "perform": {
      return true;
    }
    case "report": {
      return false;
    }
    default: {
      throw new AranTypeError(write);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: null | import(".").ReifyBinding,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *     | import("../operation").InitializeOperation
 *   ),
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeRecordLookupExpression = (hash, meta, binding, operation) => {
  if (operation.type === "read") {
    return incorporateExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeIntrinsicExpression("aran.record", hash),
              makePrimitiveExpression(operation.variable, hash),
            ],
            hash,
          ),
          hash,
        ),
        (result) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(result, hash),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            makeThrowDeadzoneExpression(operation.variable, hash),
            makeReadCacheExpression(result, hash),
            hash,
          ),
      ),
      hash,
    );
  } else if (operation.type === "typeof") {
    return incorporateExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeIntrinsicExpression("aran.record", hash),
              makePrimitiveExpression(operation.variable, hash),
            ],
            hash,
          ),
          hash,
        ),
        (result) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(result, hash),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            makeThrowDeadzoneExpression(operation.variable, hash),
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(result, hash),
              hash,
            ),
            hash,
          ),
      ),
      hash,
    );
  } else if (operation.type === "discard") {
    return zeroSequence(makePrimitiveExpression(false, hash));
  } else if (operation.type === "write") {
    return zeroSequence(
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.get", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeIntrinsicExpression("aran.record", hash),
              makePrimitiveExpression(operation.variable, hash),
            ],
            hash,
          ),
          makeIntrinsicExpression("aran.deadzone", hash),
          hash,
        ),
        makeThrowDeadzoneExpression(operation.variable, hash),
        makeRecordAliveWriteExpression(
          hash,
          binding === null ? "unknown" : binding.write,
          operation,
        ),
        hash,
      ),
    );
  } else if (operation.type === "initialize") {
    if (binding === null) {
      throw new AranExecError("Missing binding for initialize operation", {
        hash,
        operation,
      });
    } else {
      switch (binding.frame) {
        case "record": {
          return zeroSequence(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeIntrinsicExpression("aran.record", hash),
                makePrimitiveExpression(operation.variable, hash),
                makeDataDescriptorExpression(
                  {
                    value:
                      operation.right !== null
                        ? operation.right
                        : makeIntrinsicExpression("undefined", hash),
                    writable: toWritable(binding.write),
                    configurable: false,
                    enumerable: true,
                  },
                  hash,
                ),
              ],
              hash,
            ),
          );
        }
        case "global": {
          // This should have marked as early error during hoisting phase
          return zeroSequence(
            makePrimitiveExpression(
              `ARAN_DUPLICATE_VARIABLE >> ${operation.variable} >> ${hash}`,
              hash,
            ),
          );
        }
        default: {
          throw new AranTypeError(binding.frame);
        }
      }
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeGlobalLookupExpression = (hash, operation) => {
  if (operation.type === "read") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeIntrinsicExpression("aran.global", hash),
        makePrimitiveExpression(operation.variable, hash),
      ],
      hash,
    );
  } else if (operation.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.global", hash),
          makePrimitiveExpression(operation.variable, hash),
        ],
        hash,
      ),
      hash,
    );
  } else if (operation.type === "discard") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.deleteProperty", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeIntrinsicExpression("aran.global", hash),
        makePrimitiveExpression(operation.variable, hash),
      ],
      hash,
    );
  } else if (operation.type === "write") {
    if (operation.right !== null) {
      const perform = makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.global", hash),
          makePrimitiveExpression(operation.variable, hash),
          operation.right,
        ],
        hash,
      );
      switch (operation.mode) {
        case "strict": {
          return makeConditionalExpression(
            perform,
            makePrimitiveExpression(true, hash),
            makeThrowConstantExpression(operation.variable, hash),
            hash,
          );
        }
        case "sloppy": {
          return perform;
        }
        default: {
          throw new AranTypeError(operation.mode);
        }
      }
    } else {
      return makePrimitiveExpression(true, hash);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: {
 *     variable: import("estree-sentry").VariableName,
 *     baseline: "live" | "dead",
 *     write: "perform" | "report",
 *   },
 *   configurable: boolean,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").ReifyExternalPrelude
 *   ),
 *   [
 *     import("estree-sentry").VariableName,
 *     import(".").ReifyBinding,
 *   ],
 * >}
 */
const declare = (hash, binding, configurable) => {
  const writable = toWritable(binding.write);
  switch (binding.baseline) {
    case "dead": {
      return initSequence(
        [
          makeReifyExternalPrelude({
            frame: "aran.record",
            variable: binding.variable,
            origin: hash,
          }),
          makePrefixPrelude(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.set", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeIntrinsicExpression("aran.record", hash),
                  makePrimitiveExpression(binding.variable, hash),
                  makeIntrinsicExpression("aran.deadzone", hash),
                ],
                hash,
              ),
              hash,
            ),
          ),
        ],
        [
          binding.variable,
          {
            frame: "record",
            write: binding.write,
          },
        ],
      );
    }
    case "live": {
      return initSequence(
        [
          makeReifyExternalPrelude({
            frame: "aran.global",
            variable: binding.variable,
            origin: hash,
          }),
          makePrefixPrelude(
            makeConditionalEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Object.hasOwn", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeIntrinsicExpression("aran.global", hash),
                  makePrimitiveExpression(binding.variable, hash),
                ],
                hash,
              ),
              EMPTY,
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makeIntrinsicExpression("aran.global", hash),
                      makePrimitiveExpression(binding.variable, hash),
                      makeDataDescriptorExpression(
                        {
                          value: makeIntrinsicExpression("undefined", hash),
                          writable,
                          configurable,
                          enumerable: true,
                        },
                        hash,
                      ),
                    ],
                    hash,
                  ),
                  hash,
                ),
              ],
              hash,
            ),
          ),
        ],
        [
          binding.variable,
          {
            frame: "global",
            write: binding.write,
          },
        ],
      );
    }
    default: {
      throw new AranTypeError(binding.baseline);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   operation: (
 *     | import("../operation").ReadOperation
 *     | import("../operation").TypeofOperation
 *     | import("../operation").DiscardOperation
 *     | import("../operation").WriteOperation
 *   ),
 * ) => import("../../atom").Expression}
 */
export const makeMissingLookupExpression = (hash, operation) => {
  if (operation.type === "read") {
    return makeThrowMissingExpression(operation.variable, hash);
  } else if (operation.type === "typeof") {
    return makePrimitiveExpression("undefined", hash);
  } else if (operation.type === "discard") {
    return makePrimitiveExpression(true, hash);
  } else if (operation.type === "write") {
    if (operation.mode === "strict") {
      return makeThrowMissingExpression(operation.variable, hash);
    } else if (operation.mode === "sloppy") {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression("aran.global", hash),
          makePrimitiveExpression(operation.variable, hash),
          operation.right,
        ],
        hash,
      );
    } else {
      throw new AranTypeError(operation.mode);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import("../../annotation/hoisting-public").Binding,
 *   mode: "strict" | "sloppy",
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").ReifyExternalPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   [
 *     import("estree-sentry").VariableName,
 *     import(".").ReifyBinding
 *   ],
 * >}
 */
export const setupReifyEntry = (hash, binding, mode) => {
  if (binding.write === "ignore") {
    throw new AranExecError("silent constant are not supported in root frame", {
      hash,
      binding,
      mode,
    });
  } else if (binding.write === "report" || binding.write === "perform") {
    return declare(hash, /** @type {any} */ (binding), false);
  } else {
    throw new AranTypeError(binding.write);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: null | import(".").ReifyBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").ReifyExternalPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listReifySaveEffect = (hash, meta, binding, operation) => {
  switch (operation.type) {
    case "late-declare": {
      return incorporateEffect(
        thenSequence(
          declare(
            hash,
            {
              variable: operation.variable,
              baseline: "live",
              write: "perform",
            },
            true,
          ),
          EMPTY_SEQUENCE,
        ),
        hash,
      );
    }
    case "initialize": {
      if (binding === null || binding.frame === "global") {
        if (operation.right === null) {
          return EMPTY_SEQUENCE;
        } else {
          return incorporateEffect(
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                operation.right,
                hash,
              ),
              (right) =>
                liftSequenceX(
                  concat_,
                  liftSequenceX_(
                    makeExpressionEffect,
                    liftSequence_X__(
                      makeConditionalExpression,
                      makeRecordBelongExpression(hash, {
                        variable: operation.variable,
                      }),
                      makeRecordLookupExpression(hash, meta, null, {
                        ...operation,
                        type: "write",
                        right: makeReadCacheExpression(right, hash),
                      }),
                      makeConditionalExpression(
                        makeGlobalBelongExpression(hash, {
                          variable: operation.variable,
                        }),
                        makeGlobalLookupExpression(hash, {
                          ...operation,
                          type: "write",
                          right: makeReadCacheExpression(right, hash),
                        }),
                        makeMissingLookupExpression(hash, {
                          ...operation,
                          type: "write",
                          right: makeReadCacheExpression(right, hash),
                        }),
                        hash,
                      ),
                      hash,
                    ),
                    hash,
                  ),
                ),
            ),
            hash,
          );
        }
      } else if (binding.frame === "record") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            makeRecordLookupExpression(hash, meta, binding, operation),
            hash,
          ),
        );
      } else {
        throw new AranTypeError(binding.frame);
      }
    }
    case "write": {
      // We can't assume binding remained in the global object:
      // > global.x = 123;
      // > var x = 456;
      // > delete x; >> true
      // > "x" in global >> false
      if (binding === null || binding.frame === "global") {
        return incorporateEffect(
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              operation.right,
              hash,
            ),
            (right) =>
              liftSequenceX(
                concat_,
                liftSequenceX_(
                  makeExpressionEffect,
                  liftSequence_X__(
                    makeConditionalExpression,
                    makeRecordBelongExpression(hash, {
                      variable: operation.variable,
                    }),
                    makeRecordLookupExpression(hash, meta, null, {
                      ...operation,
                      right: makeReadCacheExpression(right, hash),
                    }),
                    makeConditionalExpression(
                      makeGlobalBelongExpression(hash, {
                        variable: operation.variable,
                      }),
                      makeGlobalLookupExpression(hash, {
                        ...operation,
                        right: makeReadCacheExpression(right, hash),
                      }),
                      makeMissingLookupExpression(hash, {
                        ...operation,
                        right: makeReadCacheExpression(right, hash),
                      }),
                      hash,
                    ),
                    hash,
                  ),
                  hash,
                ),
              ),
          ),
          hash,
        );
      } else if (binding.frame === "record") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            makeRecordLookupExpression(hash, meta, binding, operation),
            hash,
          ),
        );
      } else {
        throw new AranTypeError(binding.frame);
      }
    }
    case "write-sloppy-function": {
      if (operation.right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeExpressionEffect(
            makeGlobalLookupExpression(hash, {
              type: "write",
              variable: operation.variable,
              mode: operation.mode,
              right: makeReadExpression(operation.right, hash),
            }),
            hash,
          ),
        ]);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: null | import(".").ReifyBinding,
 *   operation: Exclude<
 *     import("../operation").VariableLoadOperation,
 *     import("../operation").ReadAmbientThisOperation
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeReifyLoadExpression = (hash, meta, binding, operation) => {
  // We can't assume binding remained in the global object:
  // > global.x = 123;
  // > var x = 456;
  // > delete x; >> true
  // > "x" in global >> false
  if (binding === null || binding.frame === "global") {
    return liftSequence_X__(
      makeConditionalExpression,
      makeRecordBelongExpression(hash, operation),
      makeRecordLookupExpression(hash, meta, null, operation),
      makeConditionalExpression(
        makeGlobalBelongExpression(hash, operation),
        makeGlobalLookupExpression(hash, operation),
        makeMissingLookupExpression(hash, operation),
        hash,
      ),
      hash,
    );
  } else if (binding.frame === "record") {
    return makeRecordLookupExpression(hash, meta, binding, operation);
  } else {
    throw new AranTypeError(binding.frame);
  }
};
