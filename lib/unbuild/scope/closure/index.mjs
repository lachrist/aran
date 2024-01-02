import { AranTypeError } from "../../../error.mjs";
import { guard } from "../../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeWriteParameterEffect,
} from "../../node.mjs";
import {
  bindSequence,
  initSequence,
  listenSequence,
  mapSequence,
  sequenceExpression,
  tellSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { makeEarlyErrorExpression } from "../../early-error.mjs";
import { makeEffectPrelude } from "../../prelude.mjs";

/**
 * @type {(
 *   frame: import("..").Frame,
 * ) => frame is import(".").ClosureFrame}
 */
export const isClosureFrame = (frame) =>
  frame.type === "closure-arrow" ||
  frame.type === "closure-function" ||
  frame.type === "closure-method" ||
  frame.type === "closure-constructor";

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
        makeReadParameterExpression("this", path),
        node,
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot read 'this' before initialization",
          path,
        ),
        path,
      ),
    makeReadParameterExpression("this", path),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame:
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = ({ path }, frame) => {
  if (frame.type === "closure-method") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadCacheExpression(frame.proto, path)],
      path,
    );
  } else if (frame.type === "closure-constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
      makePrimitiveExpression({ undefined: null }, path),
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
 *   frame:
 *     | import(".").MethodFrame
 *     | import(".").ConstructorFrame,
 *   operation: import("..").SetSuperOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSetSuperExpression = ({ path }, frame, operation) =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.set", path),
    makePrimitiveExpression({ undefined: null }, path),
    [
      makeSuperExpression({ path }, frame),
      makeReadCacheExpression(operation.key, path),
      makeReadCacheExpression(operation.value, path),
      makeThisExpression({ path }, frame),
    ],
    path,
  );

///////////
// setup //
///////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSetupThisConstructorEffect = ({ path, meta }) => [
  makeWriteParameterEffect(
    "this",
    makeObjectExpression(
      sequenceExpression(
        mapSequence(
          cacheConstant(
            meta,
            makeGetExpression(
              makeReadParameterExpression("new.target", path),
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
      [],
      path,
    ),
    path,
  ),
];

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
    return [];
  } else if (mode === "sloppy") {
    return [
      makeWriteParameterEffect(
        "this",
        makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadParameterExpression("this", path),
            makePrimitiveExpression(null, path),
            path,
          ),
          makeIntrinsicExpression("globalThis", path),
          makeApplyExpression(
            makeIntrinsicExpression("Object", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makeReadParameterExpression("this", path)],
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
 * ) => import("../../sequence").PreludeSequence<import(".").ClosureFrame>}
 */
export const setupClosureFrame = ({ path, meta }, frame, { mode }) => {
  if (frame.type === "closure-function") {
    return initSequence(
      [
        makeEffectPrelude(
          makeConditionalEffect(
            makeReadParameterExpression("new.target", path),
            listSetupThisConstructorEffect({ path, meta }),
            listSetupThisMethodEffect({ path }, { mode }),
            path,
          ),
        ),
      ],
      frame,
    );
  } else if (frame.type === "closure-constructor") {
    return initSequence(
      [
        makeEffectPrelude(
          makeConditionalEffect(
            makeReadParameterExpression("new.target", path),
            frame.derived
              ? []
              : [
                  ...listSetupThisConstructorEffect({ path, meta }),
                  makeConditionalEffect(
                    makeReadCacheExpression(frame.field, path),
                    [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeReadCacheExpression(frame.field, path),
                          makeReadParameterExpression("this", path),
                          [],
                          path,
                        ),
                        path,
                      ),
                    ],
                    [],
                    path,
                  ),
                ],
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
        ),
      ],
      frame,
    );
  } else if (frame.type === "closure-method") {
    return initSequence(
      [
        makeEffectPrelude(
          makeConditionalEffect(
            makeReadParameterExpression("new.target", path),
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
 *   site: import("../../site").VoidSite,
 *   frame: import("./index").ClosureFrame,
 *   operation: import("..").ClosureLoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeClosureLoadExpression = ({ path }, frame, operation) => {
  if (operation.type === "read-this") {
    if (
      frame.type === "closure-function" ||
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      return makeThisExpression({ path }, frame);
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
      return makeReadParameterExpression("new.target", path);
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
      return makeReadParameterExpression("function.arguments", path);
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
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeSuperExpression({ path }, frame),
          makeReadCacheExpression(operation.key, path),
          makeThisExpression({ path }, frame),
        ],
        path,
      );
    } else if (frame.type === "closure-function") {
      return makeEarlyErrorExpression("Illegal 'super' get", path);
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
        return makePrimitiveExpression({ undefined: null }, path);
      } else {
        return makeReadCacheExpression(operation.result, path);
      }
    } else if (frame.type === "closure-function") {
      if (operation.result === null) {
        return makeConditionalExpression(
          makeReadParameterExpression("new.target", path),
          makeReadParameterExpression("this", path),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        );
      } else {
        return makeConditionalExpression(
          makeReadParameterExpression("new.target", path),
          makeConditionalExpression(
            makeIsProperObjectExpression({ path }, { value: operation.result }),
            makeReadCacheExpression(operation.result, path),
            makeReadParameterExpression("this", path),
            path,
          ),
          makeReadCacheExpression(operation.result, path),
          path,
        );
      }
    } else if (frame.type === "closure-constructor") {
      if (operation.result === null) {
        return makeReadParameterExpression("this", path);
      } else {
        if (frame.derived) {
          return makeConditionalExpression(
            makeIsProperObjectExpression({ path }, { value: operation.result }),
            makeReadCacheExpression(operation.result, path),
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadCacheExpression(operation.result, path),
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
              makeReadParameterExpression("this", path),
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
            makeIsProperObjectExpression({ path }, { value: operation.result }),
            makeReadCacheExpression(operation.result, path),
            makeReadParameterExpression("this", path),
            path,
          );
        }
      }
    } else if (frame.type === "closure-eval") {
      return makeEarlyErrorExpression("Illegal 'return' statement", path);
    } else {
      throw new AranTypeError(frame);
    }
  } else {
    return null;
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import("./index").ClosureFrame,
 *   operation: import("..").ClosureSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listClosureSaveEffect = ({ path, meta }, frame, operation) => {
  if (operation.type === "set-super") {
    if (
      frame.type === "closure-method" ||
      frame.type === "closure-constructor"
    ) {
      if (operation.mode === "sloppy") {
        return [
          makeExpressionEffect(
            makeSetSuperExpression({ path }, frame, operation),
            path,
          ),
        ];
      } else if (operation.mode === "strict") {
        return [
          makeConditionalEffect(
            makeSetSuperExpression({ path }, frame, operation),
            [],
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
        ];
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (frame.type === "closure-function") {
      return [
        makeExpressionEffect(
          makeEarlyErrorExpression("Illegal 'super' set", path),
          path,
        ),
      ];
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
        return listenSequence(
          bindSequence(
            cacheConstant(
              meta,
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.construct", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.getPrototypeOf", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [makeReadCacheExpression(frame.self, path)],
                    path,
                  ),
                  makeReadCacheExpression(operation.input, path),
                  makeReadParameterExpression("new.target", path),
                ],
                path,
              ),
              path,
            ),
            (right) =>
              tellSequence([
                makeConditionalEffect(
                  makeReadParameterExpression("this", path),
                  [
                    makeWriteParameterEffect(
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
                            makeReadParameterExpression("this", path),
                            [],
                            path,
                          ),
                          path,
                        ),
                      ],
                      [],
                      path,
                    ),
                  ],
                  [],
                  path,
                ),
              ]),
          ),
        );
      } else {
        return [
          makeExpressionEffect(
            makeEarlyErrorExpression("Illegal 'super' call", path),
            path,
          ),
        ];
      }
    } else if (
      frame.type === "closure-function" ||
      frame.type === "closure-method"
    ) {
      return [
        makeExpressionEffect(
          makeEarlyErrorExpression("Illegal 'super' call", path),
          path,
        ),
      ];
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
