import { AranTypeError } from "../../../report.mjs";
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
    frame.kind === "constructor" && frame.derived,
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
  if (frame.kind === "method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makeIntrinsicExpression("undefined", path),
      [makeReadCacheExpression(frame.proto, path)],
      path,
    );
  } else if (frame.kind === "constructor") {
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
    frame.kind === "constructor" && frame.derived,
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
    frame.kind === "constructor" && frame.derived,
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
            mapSequence(
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
                makeConditionalExpression(
                  makeIsProperObjectExpression({ path }, { value: prototype }),
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
  if (frame.kind === "function") {
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
  } else if (frame.kind === "constructor") {
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
  } else if (frame.kind === "method") {
    return initSequence(
      map(listSetupThisMethodEffect({ path }, { mode }), makePrefixPrelude),
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
 * @type {(
 *   frame: import("./index").RoutineFrame,
 *   path: import("../../../path").Path,
 * ) => frame is import("./index").RoutineFrame & {
 *   result: import("../../cache").WritableCache,
 * }}
 */
export const shouldUpdateCompletion = (frame, path) => {
  if (frame.result === null) {
    return false;
  } else {
    if (frame.kind === "program") {
      return hasOwn(frame.completion, path);
    } else if (
      frame.kind === "arrow" ||
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return false;
    } else {
      throw new AranTypeError(frame);
    }
  }
};

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import("./index").RoutineFrame
 * >}
 */
export const makeRoutineLoadExpression = (
  site,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (operation.type === "read-this") {
    const { path, meta } = site;
    if (
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return zeroSequence(makeThisExpression({ path }, frame));
    } else if (frame.kind === "arrow") {
      return makeAlternateExpression({ path, meta }, context, operation);
    } else if (frame.kind === "program") {
      if (frame.sort === "module") {
        return zeroSequence(makeIntrinsicExpression("undefined", path));
      } else if (frame.sort === "script" || frame.sort === "eval.global") {
        return zeroSequence(makeIntrinsicExpression("globalThis", path));
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(makeReadExpression("this", path));
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression({ path, meta }, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-new-target") {
    const { path, meta } = site;
    if (
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return zeroSequence(makeReadExpression("new.target", path));
    } else if (frame.kind === "arrow") {
      return makeAlternateExpression({ path, meta }, context, operation);
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return initSyntaxErrorExpression("Illegal 'new.target' read", path);
      } else if (frame.sort === "eval.local.root") {
        return zeroSequence(makeReadExpression("new.target", path));
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression({ path, meta }, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-input") {
    const { path, meta } = site;
    if (
      frame.kind === "arrow" ||
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return zeroSequence(makeReadExpression("function.arguments", path));
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global" ||
        frame.sort === "eval.local.root"
      ) {
        return initSyntaxErrorExpression(
          "Illegal 'function.arguments' read",
          path,
        );
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression({ path, meta }, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "get-super") {
    const { path, meta } = site;
    if (frame.kind === "method" || frame.kind === "constructor") {
      return zeroSequence(makeGetSuperExpression({ path }, frame, operation));
    } else if (frame.kind === "function") {
      return initSyntaxErrorExpression("Illegal 'super' get", path);
    } else if (frame.kind === "arrow") {
      return makeAlternateExpression({ path, meta }, context, operation);
    } else if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "module" ||
        frame.sort === "eval.global"
      ) {
        return initSyntaxErrorExpression("Illegal 'super' get", path);
      } else if (frame.sort === "eval.local.deep") {
        return makeAlternateExpression({ path, meta }, context, operation);
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
    const { path, meta } = site;
    if (
      frame.kind === "arrow" ||
      frame.kind === "method" ||
      frame.kind === "program"
    ) {
      return zeroSequence(
        operation.result ??
          (frame.result === null
            ? makeIntrinsicExpression("undefined", path)
            : makeReadCacheExpression(frame.result, path)),
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
                    makeIntrinsicExpression("undefined", path),
                    path,
                  )
                : zeroSequence(frame.result)
              : cacheConstant(meta, operation.result, path)
          ),
          (result) => {
            if (frame.kind === "function") {
              return makeConditionalExpression(
                makeReadExpression("new.target", path),
                makeConditionalExpression(
                  makeIsProperObjectExpression({ path }, { value: result }),
                  makeReadCacheExpression(result, path),
                  makeReadExpression("this", path),
                  path,
                ),
                makeReadCacheExpression(result, path),
                path,
              );
            } else if (frame.kind === "constructor") {
              if (frame.derived) {
                return makeConditionalExpression(
                  makeIsProperObjectExpression({ path }, { value: result }),
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
                return makeConditionalExpression(
                  makeIsProperObjectExpression({ path }, { value: result }),
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
    const { path, meta } = site;
    if (frame.kind === "program") {
      if (
        frame.sort === "script" ||
        frame.sort === "eval.global" ||
        frame.sort === "eval.local.root" ||
        frame.sort === "eval.local.deep"
      ) {
        return initSyntaxErrorExpression("Illegal 'import.meta' read", path);
      } else if (frame.sort === "module") {
        return zeroSequence(makeReadExpression("import.meta", path));
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else if (
      frame.kind === "arrow" ||
      frame.kind === "function" ||
      frame.kind === "method" ||
      frame.kind === "constructor"
    ) {
      return makeAlternateExpression({ path, meta }, context, operation);
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "backup-result") {
    const { path } = site;
    if (frame.result === null) {
      return zeroSequence(makeIntrinsicExpression("undefined", path));
    } else {
      return zeroSequence(makeReadCacheExpression(frame.result, path));
    }
  } else {
    return makeAlternateExpression(site, context, operation);
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
  site,
  frame,
  operation,
  alternate,
  context,
) => {
  if (operation.type === "set-super") {
    const { path, meta } = site;
    if (frame.kind === "method" || frame.kind === "constructor") {
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
    } else if (frame.kind === "function") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' set", path),
          path,
        ),
      );
    } else if (frame.kind === "arrow") {
      return alternate({ path, meta }, context, operation);
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
            initSyntaxErrorExpression("Illegal 'super' set", path),
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
        return alternate({ path, meta }, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "call-super") {
    const { path, meta } = site;
    if (frame.kind === "constructor") {
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
            initSyntaxErrorExpression("Illegal 'super' call", path),
            path,
          ),
        );
      }
    } else if (frame.kind === "function" || frame.kind === "method") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression("Illegal 'super' call", path),
          path,
        ),
      );
    } else if (frame.kind === "arrow") {
      return alternate({ path, meta }, context, operation);
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
            initSyntaxErrorExpression("Illegal 'super' call", path),
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
        return alternate({ path, meta }, context, operation);
      } else {
        throw new AranTypeError(frame.sort);
      }
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "update-result") {
    const { path } = site;
    if (frame.result === null) {
      if (operation.result === null) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([makeExpressionEffect(operation.result, path)]);
      }
    } else {
      return zeroSequence([
        makeWriteCacheEffect(
          frame.result,
          operation.result ?? makeIntrinsicExpression("undefined", path),
          path,
        ),
      ]);
    }
  } else {
    return alternate(site, context, operation);
  }
};
