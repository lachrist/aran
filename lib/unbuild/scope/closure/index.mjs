import { AranTypeError } from "../../../error.mjs";
import { EMPTY, concat, concat_, guard } from "../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
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
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { makePrefixPrelude } from "../../prelude.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  incorporatePrefixEffect,
  incorporatePrefixExpression,
} from "../../prefix.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/** @type {import(".").ClosureFrame} */
export const ARROW_CLOSURE_FRAME = { type: "closure-arrow" };

/** @type {import(".").ClosureFrame} */
export const FUNCTION_CLOSURE_FRAME = { type: "closure-function" };

/** @type {import(".").ClosureFrame} */
export const EVAL_CLOSURE_FRAME = { type: "closure-eval" };

/**
 * @type {(
 *   frame: import("..").Frame,
 * ) => frame is import(".").ClosureFrame}
 */
export const isClosureFrame = (frame) =>
  frame.type === "closure-arrow" ||
  frame.type === "closure-function" ||
  frame.type === "closure-method" ||
  frame.type === "closure-constructor" ||
  frame.type === "closure-eval";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame:
 *     | import(".").FunctionFrame
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeThisExpression = ({ path }, frame) =>
  guard(
    frame.type === "closure-constructor" && frame.derived,
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
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = ({ path }, frame) => {
  if (frame.type === "closure-method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makeIntrinsicExpression("undefined", path),
      [makeReadCacheExpression(frame.proto, path)],
      path,
    );
  } else if (frame.type === "closure-constructor") {
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
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeGetSuperExpression = ({ path }, frame, operation) =>
  guard(
    frame.type === "closure-constructor" && frame.derived,
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
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSetSuperExpression = ({ path }, frame, operation) =>
  guard(
    frame.type === "closure-constructor" && frame.derived,
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
 *   aran.Effect<unbuild.Atom>[],
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
          incorporatePrefixExpression(
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
 * ) => aran.Effect<unbuild.Atom>[]}
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
 *   frame: import(".").ClosureFrame,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").ClosureFrame
 * >}
 */
export const setupClosureFrame = ({ path, meta }, frame, { mode }) => {
  if (frame.type === "closure-function") {
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
  } else if (frame.type === "closure-constructor") {
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
  } else if (frame.type === "closure-method") {
    return initSequence(
      [
        makePrefixPrelude(
          makeConditionalEffect(
            makeReadExpression("new.target", path),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "method cannot be called as a constructor",
                  path,
                ),
                path,
              ),
            ],
            listSetupThisMethodEffect({ path }, { mode }),
            path,
          ),
        ),
      ],
      frame,
    );
  } else if (frame.type === "closure-arrow" || frame.type === "closure-eval") {
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
 *   site: import("../../site").LeafSite,
 *   frame: import("./index").ClosureFrame,
 *   operation: (
 *     | import("../operation").ClosureLoadOperation
 *     | import("../operation").ReadImportMetaOperation
 *   ),
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeClosureLoadExpression = ({ path, meta }, frame, operation) => {
  if (operation.type === "read-this") {
    if (
      frame.type === "closure-function" ||
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      return zeroSequence(makeThisExpression({ path }, frame));
    } else if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-eval"
    ) {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-new-target") {
    if (
      frame.type === "closure-function" ||
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      return zeroSequence(makeReadExpression("new.target", path));
    } else if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-eval"
    ) {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-input") {
    if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-function" ||
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      return zeroSequence(makeReadExpression("function.arguments", path));
    } else if (frame.type === "closure-eval") {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "get-super") {
    if (
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      return zeroSequence(makeGetSuperExpression({ path }, frame, operation));
    } else if (frame.type === "closure-function") {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'super' get", path),
      );
    } else if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-eval"
    ) {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "wrap-result") {
    if (frame.type === "closure-arrow" || frame.type === "closure-method") {
      if (operation.result === null) {
        return zeroSequence(makeIntrinsicExpression("undefined", path));
      } else {
        return zeroSequence(operation.result);
      }
    } else if (frame.type === "closure-function") {
      if (operation.result === null) {
        return zeroSequence(
          makeConditionalExpression(
            makeReadExpression("new.target", path),
            makeReadExpression("this", path),
            makeIntrinsicExpression("undefined", path),
            path,
          ),
        );
      } else {
        return incorporatePrefixExpression(
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              operation.result,
              path,
            ),
            (result) =>
              liftSequence_X__(
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
              ),
          ),
          path,
        );
      }
    } else if (frame.type === "closure-constructor") {
      if (operation.result === null) {
        if (frame.derived) {
          return zeroSequence(
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
          );
        } else {
          return zeroSequence(makeReadExpression("this", path));
        }
      } else {
        if (frame.derived) {
          return incorporatePrefixExpression(
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                operation.result,
                path,
              ),
              (result) =>
                liftSequenceX___(
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
                ),
            ),
            path,
          );
        } else {
          return incorporatePrefixExpression(
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                operation.result,
                path,
              ),
              (result) =>
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
            ),
            path,
          );
        }
      }
    } else if (frame.type === "closure-eval") {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'return' statement", path),
      );
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.type === "closure-eval") {
      return makeEarlyErrorExpression(
        makeRegularEarlyError("Illegal 'import.meta' access", path),
      );
    } else {
      return null;
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
 *   frame: import("./index").ClosureFrame,
 *   operation: import("../operation").ClosureSaveOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *   ),
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listClosureSaveEffect = ({ path, meta }, frame, operation) => {
  if (operation.type === "set-super") {
    if (
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
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
    } else if (frame.type === "closure-function") {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError("Illegal 'super' set", path),
          ),
          path,
        ),
      );
    } else if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-eval"
    ) {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else if (operation.type === "call-super") {
    if (frame.type === "closure-constructor") {
      if (frame.derived) {
        return incorporatePrefixEffect(
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
            makeEarlyErrorExpression(
              makeRegularEarlyError("Illegal 'super' call", path),
            ),
            path,
          ),
        );
      }
    } else if (
      frame.type === "closure-function" ||
      frame.type === "closure-method"
    ) {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          makeEarlyErrorExpression(
            makeRegularEarlyError("Illegal 'super' call", path),
          ),
          path,
        ),
      );
    } else if (
      frame.type === "closure-arrow" ||
      frame.type === "closure-eval"
    ) {
      return null;
    } else {
      throw new AranTypeError(frame);
    }
  } else {
    return null;
  }
};
