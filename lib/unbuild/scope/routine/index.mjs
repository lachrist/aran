import { AranTypeError } from "../../../error.mjs";
import {
  EMPTY,
  concat,
  concat_,
  guard,
  hasOwn,
  map,
} from "../../../util/index.mjs";
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
  liftSequenceX___,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  incorporateEffect,
  incorporateExpression,
  initErrorExpression,
  makePrefixPrelude,
} from "../../prelude/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   frame: import("..").Frame,
 * ) => frame is import(".").RoutineFrame}
 */
export const isRoutineFrame = (frame) =>
  frame.type === "routine-arrow" ||
  frame.type === "routine-function" ||
  frame.type === "routine-method" ||
  frame.type === "routine-constructor" ||
  frame.type === "routine-program";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: (
 *     | import(".").FunctionFrame
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeThisExpression = ({ path }, frame) =>
  guard(
    frame.type === "routine-constructor" && frame.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", path),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot read 'this' before initialization",
          path,
        ),
        path,
      ),
    makeReadExpression("this", path),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: (
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 * ) => import("../../atom").Expression}
 */
const makeSuperExpression = ({ path }, frame) => {
  if (frame.type === "routine-method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makeIntrinsicExpression("undefined", path),
      [makeReadCacheExpression(frame.proto, path)],
      path,
    );
  } else if (frame.type === "routine-constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeGetExpression(
          makeReadCacheExpression(frame.self, path),
          makePrimitiveExpression("prototype", path),
          path,
        ),
      ],
      path,
    );
  } else {
    throw new AranTypeError(frame);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: (
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 *   operation: import("../operation").GetSuperOperation,
 * ) => import("../../atom").Expression}
 */
const makeGetSuperExpression = ({ path }, frame, operation) =>
  guard(
    frame.type === "routine-constructor" && frame.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", path),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot get `super` before calling `super`",
          path,
        ),
        path,
      ),
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeSuperExpression({ path }, frame),
        operation.key,
        makeReadExpression("this", path),
      ],
      path,
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: (
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame
 *   ),
 *   operation: import("../operation").SetSuperOperation,
 * ) => import("../../atom").Expression}
 */
const makeSetSuperExpression = ({ path }, frame, operation) =>
  guard(
    frame.type === "routine-constructor" && frame.derived,
    (node) =>
      makeConditionalExpression(
        makeReadExpression("this", path),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot set `super` before calling `super`",
          path,
        ),
        path,
      ),
    makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeSuperExpression({ path }, frame),
        operation.key,
        operation.value,
        makeReadExpression("this", path),
      ],
      path,
    ),
  );

///////////
// setup //
///////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
const listSetupThisConstructorEffect = ({ path, meta }) =>
  liftSequenceX(
    toArray,
    liftSequence_X_(
      makeWriteEffect,
      "this",
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Object.create", path),
        makeIntrinsicExpression("undefined", path),
        liftSequenceX(
          toArray,
          incorporateExpression(
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                makeGetExpression(
                  makeReadExpression("new.target", path),
                  makePrimitiveExpression("prototype", path),
                  path,
                ),
                path,
              ),
              (prototype) =>
                liftSequenceX___(
                  makeConditionalExpression,
                  makeIsProperObjectExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    { value: makeReadCacheExpression(prototype, path) },
                  ),
                  makeReadCacheExpression(prototype, path),
                  makeIntrinsicExpression("Object.prototype", path),
                  path,
                ),
            ),
            path,
          ),
        ),
        path,
      ),
      path,
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../atom").Effect[]}
 */
const listSetupThisMethodEffect = ({ path }, { mode }) => {
  if (mode === "strict") {
    return EMPTY;
  } else if (mode === "sloppy") {
    return [
      makeWriteEffect(
        "this",
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadExpression("this", path),
            makePrimitiveExpression(null, path),
            path,
          ),
          makeIntrinsicExpression("globalThis", path),
          makeApplyExpression(
            makeIntrinsicExpression("Object", path),
            makeIntrinsicExpression("undefined", path),
            [makeReadExpression("this", path)],
            path,
          ),
          path,
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RoutineFrame,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RoutineFrame
 * >}
 */
export const setupRoutineFrame = ({ path, meta }, frame, { mode }) => {
  if (frame.type === "routine-function") {
    return bindSequence(
      liftSequence_X__(
        makeConditionalEffect,
        makeReadExpression("new.target", path),
        listSetupThisConstructorEffect({ path, meta }),
        listSetupThisMethodEffect({ path }, { mode }),
        path,
      ),
      (setup) => initSequence([makePrefixPrelude(setup)], frame),
    );
  } else if (frame.type === "routine-constructor") {
    return bindSequence(
      liftSequence_X__(
        makeConditionalEffect,
        makeReadExpression("new.target", path),
        frame.derived
          ? EMPTY_SEQUENCE
          : liftSequenceX_(
              concat,
              listSetupThisConstructorEffect({ path, meta }),
              [
                makeConditionalEffect(
                  makeReadCacheExpression(frame.field, path),
                  [
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeReadCacheExpression(frame.field, path),
                        makeReadExpression("this", path),
                        [],
                        path,
                      ),
                      path,
                    ),
                  ],
                  EMPTY,
                  path,
                ),
              ],
            ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "constructor cannot be called as a method",
              path,
            ),
            path,
          ),
        ],
        path,
      ),
      (setup) => initSequence([makePrefixPrelude(setup)], frame),
    );
  } else if (frame.type === "routine-method") {
    return initSequence(
      map(listSetupThisMethodEffect({ path }, { mode }), makePrefixPrelude),
      frame,
    );
  } else if (
    frame.type === "routine-arrow" ||
    frame.type === "routine-program"
  ) {
    return zeroSequence(frame);
  } else {
    throw new AranTypeError(frame);
  }
};

//////////
// load //
//////////

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import("./index").RoutineFrame,
 * ) => frame is import("./index").RoutineFrame & {
 *   result: import("../../cache").WritableCache,
 * }}
 */
export const willUpdateResult = ({ path }, frame) => {
  if (frame.result === null) {
    return false;
  } else {
    if (frame.type === "routine-program") {
      return hasOwn(frame.completion, path);
    } else if (
      frame.type === "routine-arrow" ||
      frame.type === "routine-function" ||
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      return true;
    } else {
      throw new AranTypeError(frame);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import("./index").RoutineFrame,
 *   operation: (
 *     | import("../operation").RoutineLoadOperation
 *     | import("../operation").ReadImportMetaOperation
 *   ),
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").ErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Expression,
 * >}
 */
export const makeRoutineLoadExpression = ({ path, meta }, frame, operation) => {
  if (operation.type === "read-this") {
    if (
      frame.type === "routine-function" ||
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      return zeroSequence(makeThisExpression({ path }, frame));
    } else if (frame.type === "routine-arrow") {
      return null;
    } else if (frame.type === "routine-program") {
      if (frame.sort === "module") {
        return zeroSequence(makeIntrinsicExpression("undefined", path));
      } else if (frame.sort === "script" || frame.sort === "eval.global") {
        return zeroSequence(makeIntrinsicExpression("globalThis", path));
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(makeReadExpression("this", path));
      } else if (frame.sort === "eval.local.deep") {
        return null;
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-new-target") {
    if (
      frame.type === "routine-function" ||
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      return zeroSequence(makeReadExpression("new.target", path));
    } else if (frame.type === "routine-arrow") {
      return null;
    } else if (frame.type === "routine-program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return initErrorExpression("Illegal 'new.target' read", path);
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(makeReadExpression("new.target", path));
      } else if (frame.sort === "eval.local.deep") {
        return null;
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-input") {
    if (
      frame.type === "routine-arrow" ||
      frame.type === "routine-function" ||
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      return zeroSequence(makeReadExpression("function.arguments", path));
    } else if (frame.type === "routine-program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global" ||
        frame.sort === "eval.local.root"
      ) {
        return initErrorExpression("Illegal 'function.arguments' read", path);
      } else if (frame.sort === "eval.local.deep") {
        return null;
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "get-super") {
    if (
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      return zeroSequence(makeGetSuperExpression({ path }, frame, operation));
    } else if (frame.type === "routine-function") {
      return initErrorExpression("Illegal 'super' get", path);
    } else if (frame.type === "routine-arrow") {
      return null;
    } else if (frame.type === "routine-program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return initErrorExpression("Illegal 'super' get", path);
      } else if (frame.sort === "eval.local.deep") {
        return null;
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(
          makeApplyExpression(
            makeReadExpression("super.get", path),
            makeIntrinsicExpression("undefined", path),
            [operation.key],
            path,
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
      frame.type === "routine-arrow" ||
      frame.type === "routine-method" ||
      frame.type === "routine-program"
    ) {
      return zeroSequence(
        operation.result ??
          (frame.result === null
            ? makeIntrinsicExpression("undefined", path)
            : makeReadCacheExpression(frame.result, path)),
      );
    } else if (
      frame.type === "routine-function" ||
      frame.type === "routine-constructor"
    ) {
      return incorporateExpression(
        bindSequence(
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
                    makeIntrinsicExpression("undefined", path),
                    path,
                  )
                : zeroSequence(frame.result)
              : cacheConstant(meta, operation.result, path)
          ),
          (result) => {
            if (frame.type === "routine-function") {
              return liftSequence_X__(
                makeConditionalExpression,
                makeReadExpression("new.target", path),
                liftSequenceX___(
                  makeConditionalExpression,
                  makeIsProperObjectExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    { value: makeReadCacheExpression(result, path) },
                  ),
                  makeReadCacheExpression(result, path),
                  makeReadExpression("this", path),
                  path,
                ),
                makeReadCacheExpression(result, path),
                path,
              );
            } else if (frame.type === "routine-constructor") {
              if (frame.derived) {
                return liftSequenceX___(
                  makeConditionalExpression,
                  makeIsProperObjectExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    { value: makeReadCacheExpression(result, path) },
                  ),
                  makeReadCacheExpression(result, path),
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "===",
                      makeReadCacheExpression(result, path),
                      makeIntrinsicExpression("undefined", path),
                      path,
                    ),
                    makeConditionalExpression(
                      makeReadExpression("this", path),
                      makeReadExpression("this", path),
                      makeThrowErrorExpression(
                        "ReferenceError",
                        "Derived constructors must call super before returning default value",
                        path,
                      ),
                      path,
                    ),
                    makeThrowErrorExpression(
                      "TypeError",
                      "Derived constructors may only return object or undefined",
                      path,
                    ),
                    path,
                  ),
                  path,
                );
              } else {
                return liftSequenceX___(
                  makeConditionalExpression,
                  makeIsProperObjectExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    { value: makeReadCacheExpression(result, path) },
                  ),
                  makeReadCacheExpression(result, path),
                  makeReadExpression("this", path),
                  path,
                );
              }
            } else {
              throw new AranTypeError(frame);
            }
          },
        ),
        path,
      );
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.type === "routine-program") {
      if (
        frame.sort === "script" ||
        frame.sort === "eval.global" ||
        frame.sort === "eval.local.root" ||
        frame.sort === "eval.local.deep"
      ) {
        return initErrorExpression("Illegal 'import.meta' read", path);
      } else if (frame.sort === "module") {
        return zeroSequence(makeReadExpression("import.meta", path));
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else if (
      frame.type === "routine-arrow" ||
      frame.type === "routine-function" ||
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import("./index").RoutineFrame,
 *   operation: import("../operation").RoutineSaveOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").ErrorPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listRoutineSaveEffect = ({ path, meta }, frame, operation) => {
  if (operation.type === "set-super") {
    if (
      frame.type === "routine-method" ||
      frame.type === "routine-constructor"
    ) {
      if (operation.mode === "sloppy") {
        return zeroSequence([
          makeExpressionEffect(
            makeSetSuperExpression({ path }, frame, operation),
            path,
          ),
        ]);
      } else if (operation.mode === "strict") {
        return zeroSequence([
          makeConditionalEffect(
            makeSetSuperExpression({ path }, frame, operation),
            EMPTY,
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "Cannot assign super property",
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ]);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (frame.type === "routine-function") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initErrorExpression("Illegal 'super' set", path),
          path,
        ),
      );
    } else if (frame.type === "routine-arrow") {
      return null;
    } else if (frame.type === "routine-program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initErrorExpression("Illegal 'super' set", path),
            path,
          ),
        );
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence([
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression("super.set", path),
              makeIntrinsicExpression("undefined", path),
              [operation.key, operation.value],
              path,
            ),
            path,
          ),
        ]);
      } else if (frame.sort === "eval.local.deep") {
        return null;
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "call-super") {
    if (frame.type === "routine-constructor") {
      if (frame.derived) {
        return incorporateEffect(
          mapSequence(
            cacheConstant(
              meta,
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.construct", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.getPrototypeOf", path),
                    makeIntrinsicExpression("undefined", path),
                    [makeReadCacheExpression(frame.self, path)],
                    path,
                  ),
                  operation.input,
                  makeReadExpression("new.target", path),
                ],
                path,
              ),
              path,
            ),
            (right) => [
              makeConditionalEffect(
                makeReadExpression("this", path),
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression(
                      "ReferenceError",
                      "Duplicate super call",
                      path,
                    ),
                    path,
                  ),
                ],
                [
                  makeWriteEffect(
                    "this",
                    makeReadCacheExpression(right, path),
                    path,
                  ),
                  makeConditionalEffect(
                    makeReadCacheExpression(frame.field, path),
                    [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeReadCacheExpression(frame.field, path),
                          makeReadExpression("this", path),
                          [],
                          path,
                        ),
                        path,
                      ),
                    ],
                    EMPTY,
                    path,
                  ),
                ],
                path,
              ),
            ],
          ),
          path,
        );
      } else {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initErrorExpression("Illegal 'super' call", path),
            path,
          ),
        );
      }
    } else if (
      frame.type === "routine-function" ||
      frame.type === "routine-method"
    ) {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initErrorExpression("Illegal 'super' call", path),
          path,
        ),
      );
    } else if (frame.type === "routine-arrow") {
      return null;
    } else if (frame.type === "routine-program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeExpressionEffect,
            initErrorExpression("Illegal 'super' call", path),
            path,
          ),
        );
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence([
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression("super.call", path),
              makeIntrinsicExpression("undefined", path),
              [operation.input],
              path,
            ),
            path,
          ),
        ]);
      } else if (frame.sort === "eval.local.deep") {
        return null;
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "update-result") {
    if (willUpdateResult({ path }, frame)) {
      return zeroSequence([
        makeWriteCacheEffect(
          frame.result,
          operation.result ?? makeIntrinsicExpression("undefined", path),
          path,
        ),
      ]);
    } else {
      if (operation.result === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([makeExpressionEffect(operation.result, path)]);
      }
    }
  } else {
    throw new AranTypeError(operation);
  }
};
