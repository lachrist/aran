import { AranTypeError } from "../../../report.mjs";
import { EMPTY, concat, concat_, guard, map } from "../../../util/index.mjs";
import {
  cacheConstant,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../node.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  incorporateEffect,
  incorporateExpression,
  initSyntaxErrorExpression,
  makePrefixPrelude,
} from "../../prelude/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   frame: (
 *     | import(".").FunctionFrame
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeThisExpression = (hash, frame) =>
  guard(
    frame.kind === "constructor" && frame.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", hash),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot read 'this' before initialization",
          hash,
        ),
        hash,
      ),
    makeReadExpression("this", hash),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   frame: (
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeSuperExpression = (hash, frame) => {
  if (frame.kind === "method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", hash),
      makeIntrinsicExpression("undefined", hash),
      [makeReadCacheExpression(frame.proto, hash)],
      hash,
    );
  } else if (frame.kind === "constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeGetExpression(
          makeReadCacheExpression(frame.self, hash),
          makePrimitiveExpression("prototype", hash),
          hash,
        ),
      ],
      hash,
    );
  } else {
    throw new AranTypeError(frame);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   frame: (
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 *   operation: import("../operation").GetSuperOperation,
 * ) => import("../../atom").Expression}
 */
const makeGetSuperExpression = (hash, frame, operation) =>
  guard(
    frame.kind === "constructor" && frame.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", hash),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot get `super` before calling `super`",
          hash,
        ),
        hash,
      ),
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeSuperExpression(hash, frame),
        operation.key,
        makeReadExpression("this", hash),
      ],
      hash,
    ),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   frame: (
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 *   operation: import("../operation").SetSuperOperation,
 * ) => import("../../atom").Expression}
 */
const makeSetSuperExpression = (hash, frame, operation) =>
  guard(
    frame.kind === "constructor" && frame.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", hash),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot set `super` before calling `super`",
          hash,
        ),
        hash,
      ),
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeSuperExpression(hash, frame),
        operation.key,
        operation.value,
        makeReadExpression("this", hash),
      ],
      hash,
    ),
  );

///////////
// setup //
///////////

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
const listSetupThisConstructorEffect = (hash, meta) =>
  liftSequenceX(
    toArray,
    liftSequence_X_(
      makeWriteEffect,
      "this",
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Object.create", hash),
        makeIntrinsicExpression("undefined", hash),
        liftSequenceX(
          toArray,
          incorporateExpression(
            mapSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeGetExpression(
                  makeReadExpression("new.target", hash),
                  makePrimitiveExpression("prototype", hash),
                  hash,
                ),
                hash,
              ),
              (prototype) =>
                makeConditionalExpression(
                  makeIsProperObjectExpression(hash, { value: prototype }),
                  makeReadCacheExpression(prototype, hash),
                  makeIntrinsicExpression("Object.prototype", hash),
                  hash,
                ),
            ),
            hash,
          ),
        ),
        hash,
      ),
      hash,
    ),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   mode: "strict" | "sloppy",
 * ) => import("../../atom").Effect[]}
 */
const listSetupThisMethodEffect = (hash, mode) => {
  if (mode === "strict") {
    return EMPTY;
  } else if (mode === "sloppy") {
    return [
      makeWriteEffect(
        "this",
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadExpression("this", hash),
            makePrimitiveExpression(null, hash),
            hash,
          ),
          makeIntrinsicExpression("globalThis", hash),
          makeApplyExpression(
            makeIntrinsicExpression("Object", hash),
            makeIntrinsicExpression("undefined", hash),
            [makeReadExpression("this", hash)],
            hash,
          ),
          hash,
        ),
        hash,
      ),
    ];
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   frame: import(".").RoutineFrame,
 *   mode: "strict" | "sloppy",
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RoutineFrame
 * >}
 */
export const setupRoutineFrame = (hash, meta, frame, mode) => {
  if (frame.kind === "function") {
    return bindSequence(
      liftSequence_X__(
        makeConditionalEffect,
        makeReadExpression("new.target", hash),
        listSetupThisConstructorEffect(hash, meta),
        listSetupThisMethodEffect(hash, mode),
        hash,
      ),
      (setup) => initSequence([makePrefixPrelude(setup)], frame),
    );
  } else if (frame.kind === "constructor") {
    return bindSequence(
      liftSequence_X__(
        makeConditionalEffect,
        makeReadExpression("new.target", hash),
        frame.derived
          ? EMPTY_SEQUENCE
          : liftSequenceX_(concat, listSetupThisConstructorEffect(hash, meta), [
              makeConditionalEffect(
                makeReadCacheExpression(frame.field, hash),
                [
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeReadCacheExpression(frame.field, hash),
                      makeReadExpression("this", hash),
                      [],
                      hash,
                    ),
                    hash,
                  ),
                ],
                EMPTY,
                hash,
              ),
            ]),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "constructor cannot be called as a method",
              hash,
            ),
            hash,
          ),
        ],
        hash,
      ),
      (setup) => initSequence([makePrefixPrelude(setup)], frame),
    );
  } else if (frame.kind === "method") {
    return initSequence(
      map(listSetupThisMethodEffect(hash, mode), makePrefixPrelude),
      frame,
    );
  } else if (frame.kind === "arrow" || frame.kind === "program") {
    return zeroSequence(frame);
  } else {
    throw new AranTypeError(frame);
  }
};

//////////
// load //
//////////

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import("./index").RoutineFrame
 * >}
 */
export const makeRoutineLoadExpression = (
  hash,
  meta,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (operation.type === "read-this") {
    if (
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return zeroSequence(makeThisExpression(hash, frame));
    } else if (frame.kind === "arrow") {
      return makeAlternateExpression(hash, meta, context, operation);
    } else if (frame.kind === "program") {
      if (frame.sort === "module") {
        return zeroSequence(makeIntrinsicExpression("undefined", hash));
      } else if (frame.sort === "script" || frame.sort === "eval.global") {
        return zeroSequence(makeIntrinsicExpression("globalThis", hash));
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(makeReadExpression("this", hash));
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression(hash, meta, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-new-target") {
    if (
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return zeroSequence(makeReadExpression("new.target", hash));
    } else if (frame.kind === "arrow") {
      return makeAlternateExpression(hash, meta, context, operation);
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return initSyntaxErrorExpression("Illegal 'new.target' read", hash);
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(makeReadExpression("new.target", hash));
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression(hash, meta, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-input") {
    if (
      frame.kind === "arrow" ||
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return zeroSequence(makeReadExpression("function.arguments", hash));
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global" ||
        frame.sort === "eval.local.root"
      ) {
        return initSyntaxErrorExpression(
          "Illegal 'function.arguments' read",
          hash,
        );
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression(hash, meta, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "get-super") {
    if (frame.kind === "method" || frame.kind === "constructor") {
      return zeroSequence(makeGetSuperExpression(hash, frame, operation));
    } else if (frame.kind === "function") {
      return initSyntaxErrorExpression("Illegal 'super' get", hash);
    } else if (frame.kind === "arrow") {
      return makeAlternateExpression(hash, meta, context, operation);
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return initSyntaxErrorExpression("Illegal 'super' get", hash);
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression(hash, meta, context, operation);
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(
          makeApplyExpression(
            makeReadExpression("super.get", hash),
            makeIntrinsicExpression("undefined", hash),
            [operation.key],
            hash,
          ),
        );
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "finalize-result") {
    if (
      frame.kind === "arrow" ||
      frame.kind === "method" ||
      frame.kind === "program"
    ) {
      return zeroSequence(
        operation.result ??
          (frame.result === null
            ? makeIntrinsicExpression("undefined", hash)
            : makeReadCacheExpression(frame.result, hash)),
      );
    } else if (frame.kind === "function" || frame.kind === "constructor") {
      return incorporateExpression(
        mapSequence(
          /**
           * @type {import("../../../sequence").Sequence<
           *   import("../../prelude").PrefixPrelude,
           *   import("../../cache").Cache,
           * >}
           */ (
            operation.result === null
              ? frame.result === null
                ? cacheConstant(
                    meta,
                    makeIntrinsicExpression("undefined", hash),
                    hash,
                  )
                : zeroSequence(frame.result)
              : cacheConstant(meta, operation.result, hash)
          ),
          (result) => {
            if (frame.kind === "function") {
              return makeConditionalExpression(
                makeReadExpression("new.target", hash),
                makeConditionalExpression(
                  makeIsProperObjectExpression(hash, { value: result }),
                  makeReadCacheExpression(result, hash),
                  makeReadExpression("this", hash),
                  hash,
                ),
                makeReadCacheExpression(result, hash),
                hash,
              );
            } else if (frame.kind === "constructor") {
              if (frame.derived) {
                return makeConditionalExpression(
                  makeIsProperObjectExpression(hash, { value: result }),
                  makeReadCacheExpression(result, hash),
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "===",
                      makeReadCacheExpression(result, hash),
                      makeIntrinsicExpression("undefined", hash),
                      hash,
                    ),
                    makeConditionalExpression(
                      makeReadExpression("this", hash),
                      makeReadExpression("this", hash),
                      makeThrowErrorExpression(
                        "ReferenceError",
                        "Derived constructors must call super before returning default value",
                        hash,
                      ),
                      hash,
                    ),
                    makeThrowErrorExpression(
                      "TypeError",
                      "Derived constructors may only return object or undefined",
                      hash,
                    ),
                    hash,
                  ),
                  hash,
                );
              } else {
                return makeConditionalExpression(
                  makeIsProperObjectExpression(hash, { value: result }),
                  makeReadCacheExpression(result, hash),
                  makeReadExpression("this", hash),
                  hash,
                );
              }
            } else {
              throw new AranTypeError(frame);
            }
          },
        ),
        hash,
      );
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "eval.global" ||
        frame.sort === "eval.local.root" ||
        frame.sort === "eval.local.deep"
      ) {
        return initSyntaxErrorExpression("Illegal 'import.meta' read", hash);
      } else if (frame.sort === "module") {
        return zeroSequence(makeReadExpression("import.meta", hash));
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else if (
      frame.kind === "arrow" ||
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return makeAlternateExpression(hash, meta, context, operation);
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "backup-result") {
    if (frame.result === null) {
      return zeroSequence(makeIntrinsicExpression("undefined", hash));
    } else {
      return zeroSequence(makeReadCacheExpression(frame.result, hash));
    }
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

//////////
// save //
//////////

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").RoutineFrame
 * >}
 */
export const listRoutineSaveEffect = (
  hash,
  meta,
  frame,
  operation,
  alternate,
  context,
) => {
  if (operation.type === "set-super") {
    if (frame.kind === "method" || frame.kind === "constructor") {
      if (operation.mode === "sloppy") {
        return zeroSequence([
          makeExpressionEffect(
            makeSetSuperExpression(hash, frame, operation),
            hash,
          ),
        ]);
      } else if (operation.mode === "strict") {
        return zeroSequence([
          makeConditionalEffect(
            makeSetSuperExpression(hash, frame, operation),
            EMPTY,
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "Cannot assign super property",
                  hash,
                ),
                hash,
              ),
            ],
            hash,
          ),
        ]);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (frame.kind === "function") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' set", hash),
          hash,
        ),
      );
    } else if (frame.kind === "arrow") {
      return alternate(hash, meta, context, operation);
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal 'super' set", hash),
            hash,
          ),
        );
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence([
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression("super.set", hash),
              makeIntrinsicExpression("undefined", hash),
              [operation.key, operation.value],
              hash,
            ),
            hash,
          ),
        ]);
      } else if (frame.sort === "eval.local.deep") {
        return alternate(hash, meta, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "call-super") {
    if (frame.kind === "constructor") {
      if (frame.derived) {
        return incorporateEffect(
          mapSequence(
            cacheConstant(
              meta,
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.construct", hash),
                makeIntrinsicExpression("undefined", hash),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.getPrototypeOf", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [makeReadCacheExpression(frame.self, hash)],
                    hash,
                  ),
                  operation.input,
                  makeReadExpression("new.target", hash),
                ],
                hash,
              ),
              hash,
            ),
            (right) => [
              makeConditionalEffect(
                makeReadExpression("this", hash),
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression(
                      "ReferenceError",
                      "Duplicate super call",
                      hash,
                    ),
                    hash,
                  ),
                ],
                [
                  makeWriteEffect(
                    "this",
                    makeReadCacheExpression(right, hash),
                    hash,
                  ),
                  makeConditionalEffect(
                    makeReadCacheExpression(frame.field, hash),
                    [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeReadCacheExpression(frame.field, hash),
                          makeReadExpression("this", hash),
                          [],
                          hash,
                        ),
                        hash,
                      ),
                    ],
                    EMPTY,
                    hash,
                  ),
                ],
                hash,
              ),
            ],
          ),
          hash,
        );
      } else {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal 'super' call", hash),
            hash,
          ),
        );
      }
    } else if (frame.kind === "function" || frame.kind === "method") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' call", hash),
          hash,
        ),
      );
    } else if (frame.kind === "arrow") {
      return alternate(hash, meta, context, operation);
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression("Illegal 'super' call", hash),
            hash,
          ),
        );
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence([
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression("super.call", hash),
              makeIntrinsicExpression("undefined", hash),
              [operation.input],
              hash,
            ),
            hash,
          ),
        ]);
      } else if (frame.sort === "eval.local.deep") {
        return alternate(hash, meta, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "update-result") {
    if (frame.result === null) {
      if (operation.result === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([makeExpressionEffect(operation.result, hash)]);
      }
    } else {
      return zeroSequence([
        makeWriteCacheEffect(
          frame.result,
          operation.result ?? makeIntrinsicExpression("undefined", hash),
          hash,
        ),
      ]);
    }
  } else {
    return alternate(hash, meta, context, operation);
  }
};
