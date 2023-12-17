import { AranTypeError } from "../../../error.mjs";
import { guard } from "../../../util/index.mjs";
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
  makeReadParameterExpression,
  makeWriteParameterEffect,
} from "../../node.mjs";
import { bindSequence, listenSequence, tellSequence } from "../../sequence.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";

/** @type {Record<import(".").ClosureFrame["type"], null>} */
export const CLOSURE = {
  "closure-arrow": null,
  "closure-block": null,
  "closure-constructor": null,
  "closure-function": null,
  "closure-method": null,
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame:
 *       | import(".").FunctionFrame
 *       | import(".").MethodFrame
 *       | import(".").ConstructorFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeThisExpression = ({ path }, _context, { frame }) =>
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame:
 *       | import(".").MethodFrame
 *       | import(".").ConstructorFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = ({ path }, _context, { frame }) => {
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
    throw new AranTypeError("invalid super frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import(".").ClosureFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeClosureThisExpression = (site, context, { frame }) => {
  if (
    frame.type === "closure-function" ||
    frame.type === "closure-method" ||
    frame.type === "closure-constructor"
  ) {
    return makeThisExpression(site, context, { frame });
  } else if (frame.type === "closure-arrow" || frame.type === "closure-block") {
    return null;
  } else {
    throw new AranTypeError("invalid closure frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import(".").ClosureFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeClosureNewTargetExpression = (
  { path },
  _context,
  { frame },
) => {
  if (
    frame.type === "closure-function" ||
    frame.type === "closure-method" ||
    frame.type === "closure-constructor"
  ) {
    return makeReadParameterExpression("new.target", path);
  } else if (frame.type === "closure-arrow" || frame.type === "closure-block") {
    return null;
  } else {
    throw new AranTypeError("invalid closure frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").ClosureFrame,
 *     key: import("../../cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeClosureGetSuperExpression = (
  { path },
  context,
  { frame, key },
) => {
  if (frame.type === "closure-method" || frame.type === "closure-constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeSuperExpression({ path }, context, { frame }),
        makeReadCacheExpression(key, path),
        makeThisExpression({ path }, context, { frame }),
      ],
      path,
    );
  } else if (frame.type === "closure-function") {
    return makeSyntaxErrorExpression("Illegal 'super' get", path);
  } else if (frame.type === "closure-arrow" || frame.type === "closure-block") {
    return null;
  } else {
    throw new AranTypeError("invalid frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").ClosureFrame,
 *     key: import("../../cache").Cache,
 *     value: import("../../cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const listClosureSetSuperEffect = (
  { path },
  context,
  { frame, key, value },
) => {
  if (frame.type === "closure-method" || frame.type === "closure-constructor") {
    return makeApplyExpression(
      makeIntrinsicExpression("Reflect.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeSuperExpression({ path }, context, { frame }),
        makeReadCacheExpression(key, path),
        makeReadCacheExpression(value, path),
        makeThisExpression({ path }, context, { frame }),
      ],
      path,
    );
  } else if (frame.type === "closure-function") {
    return makeSyntaxErrorExpression("Illegal 'super' set", path);
  } else if (frame.type === "closure-arrow" || frame.type === "closure-block") {
    return null;
  } else {
    throw new AranTypeError("invalid frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").ClosureFrame,
 *     input: import("../../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listClosureCallSuperEffect = (
  { path, meta },
  _context,
  { frame, input },
) => {
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
                makeReadCacheExpression(input, path),
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
          makeSyntaxErrorExpression("Illegal 'super' call", path),
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
        makeSyntaxErrorExpression("Illegal 'super' call", path),
        path,
      ),
    ];
  } else if (frame.type === "closure-arrow" || frame.type === "closure-block") {
    return null;
  } else {
    throw new AranTypeError("invalid frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").ClosureFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeFunctionArgumentsExpression = (
  { path },
  _context,
  { frame },
) => {
  if (
    frame.type === "closure-arrow" ||
    frame.type === "closure-function" ||
    frame.type === "closure-method" ||
    frame.type === "closure-constructor"
  ) {
    return makeReadParameterExpression("function.arguments", path);
  } else if (frame.type === "closure-block") {
    return null;
  } else {
    throw new AranTypeError("invalid frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").ClosureFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeCatchErrorExpression = ({ path }, _context, { frame }) => {
  if (frame.type === "closure-block") {
    if (frame.kind === "catch") {
      return makeReadParameterExpression("catch.error", path);
    } else {
      return null;
    }
  } else if (
    frame.type === "closure-arrow" ||
    frame.type === "closure-function" ||
    frame.type === "closure-method" ||
    frame.type === "closure-constructor"
  ) {
    return null;
  } else {
    throw new AranTypeError("invalid frame", frame);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").ClosureFrame,
 *     result: import("../../cache").Cache | null,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeResultExpression = ({ path }, _context, { frame, result }) => {
  if (frame.type === "closure-arrow" || frame.type === "closure-method") {
    return result === null
      ? makePrimitiveExpression({ undefined: null }, path)
      : makeReadCacheExpression(result, path);
  } else if (frame.type === "closure-function") {
    if (result === null) {
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
          makeIsProperObjectExpression({ path }, { value: result }),
          makeReadCacheExpression(result, path),
          makeReadParameterExpression("this", path),
          path,
        ),
        makeReadCacheExpression(result, path),
        path,
      );
    }
  } else if (frame.type === "closure-constructor") {
    if (result === null) {
      return makeReadParameterExpression("this", path);
    } else {
      if (frame.derived) {
        return makeConditionalExpression(
          makeIsProperObjectExpression({ path }, { value: result }),
          makeReadCacheExpression(result, path),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadCacheExpression(result, path),
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
          makeIsProperObjectExpression({ path }, { value: result }),
          makeReadCacheExpression(result, path),
          makeReadParameterExpression("this", path),
          path,
        );
      }
    }
  } else if (frame.type === "closure-block") {
    if (frame.kind === "eval") {
      return makeSyntaxErrorExpression("Illegal 'return' statement", path);
    } else {
      return null;
    }
  } else {
    throw new AranTypeError("invalid frame", frame);
  }
};
