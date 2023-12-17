import { AranTypeError } from "../../../error.mjs";
import { isExternalLocalEvalSitu } from "../../../situ.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  tellHeader,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";
import { makeThrowMissingExpression } from "../error.mjs";

/** @type {Record<import(".").RootFrame["type"], null>} */
export const ROOT = {
  root: null,
};

//////////
// load //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     frame: import("./index").RootFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootLoadExpression = (
  { path },
  context,
  { operation, frame, variable },
) => {
  switch (frame.situ.ambient) {
    case "internal": {
      switch (operation) {
        case "read": {
          return makeThrowMissingExpression(variable, path);
        }
        case "typeof": {
          return makePrimitiveExpression("undefined", path);
        }
        case "discard": {
          return makePrimitiveExpression(true, path);
        }
        default: {
          throw new AranTypeError("invalid load operation", operation);
        }
      }
    }
    case "external": {
      return tellHeader(
        makeApplyExpression(
          makeReadParameterExpression(`${operation}.${context.mode}`, path),
          makePrimitiveExpression({ undefined: null }, path),
          [makePrimitiveExpression(variable, path)],
          path,
        ),
        {
          type: "lookup",
          mode: context.mode,
          variable,
        },
      );
    }
    default: {
      throw new AranTypeError("invalid situ", frame.situ);
    }
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "write",
 *     frame: import("./index").RootFrame,
 *     variable: estree.Variable,
 *     right: import("../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRootSaveEffect = (
  { path },
  context,
  { operation, frame, variable, right },
) => {
  switch (frame.situ.ambient) {
    case "internal": {
      if (right === null) {
        return [];
      } else {
        switch (context.mode) {
          case "sloppy": {
            return [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.set", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeIntrinsicExpression("aran.global", path),
                    makePrimitiveExpression(variable, path),
                    makeReadCacheExpression(right, path),
                  ],
                  path,
                ),
                path,
              ),
            ];
          }
          case "strict": {
            return [
              makeExpressionEffect(
                makeThrowMissingExpression(variable, path),
                path,
              ),
            ];
          }
          default: {
            throw new AranTypeError("invalid mode", context.mode);
          }
        }
      }
    }
    case "external": {
      if (right === null) {
        return [];
      } else {
        return [
          makeExpressionEffect(
            tellHeader(
              makeApplyExpression(
                makeReadParameterExpression(
                  `${operation}.${context.mode}`,
                  path,
                ),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makePrimitiveExpression(variable, path),
                  makeReadCacheExpression(right, path),
                ],
                path,
              ),
              {
                type: "lookup",
                mode: context.mode,
                variable,
              },
            ),
            path,
          ),
        ];
      }
    }
    default: {
      throw new AranTypeError("invalid situ", frame.situ);
    }
  }
};

///////////
// super //
///////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").RootFrame,
 *     key: import("../../cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootGetSuperExpression = (
  { path },
  _context,
  { frame, key },
) => {
  if (
    isExternalLocalEvalSitu(frame.situ) &&
    (frame.situ.closure === "method" || frame.situ.closure === "constructor")
  ) {
    return makeApplyExpression(
      makeReadParameterExpression("super.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadCacheExpression(key, path)],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' get", path);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").RootFrame,
 *     key: import("../../cache").Cache,
 *     value: import("../../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRootSetSuperEffect = (
  { path },
  _context,
  { frame, key, value },
) => {
  if (
    isExternalLocalEvalSitu(frame.situ) &&
    (frame.situ.closure === "method" || frame.situ.closure === "constructor")
  ) {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeReadParameterExpression("super.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(key, path),
            makeReadCacheExpression(value, path),
          ],
          path,
        ),
        path,
      ),
    ];
  } else {
    return [
      makeExpressionEffect(
        makeSyntaxErrorExpression("Illegal 'super' set", path),
        path,
      ),
    ];
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").RootFrame,
 *     input: import("../../cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootCallSuperExpression = (
  { path },
  _context,
  { frame, input },
) => {
  if (
    isExternalLocalEvalSitu(frame.situ) &&
    frame.situ.closure === "constructor"
  ) {
    return makeApplyExpression(
      makeReadParameterExpression("super.call", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadCacheExpression(input, path)],
      path,
    );
  } else {
    return makeSyntaxErrorExpression("Illegal 'super' call", path);
  }
};

////////////////
// new.target //
////////////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").RootFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootNewTargetExpression = ({ path }, _context, { frame }) => {
  if (
    isExternalLocalEvalSitu(frame.situ) &&
    (frame.situ.closure === "constructor" ||
      frame.situ.closure === "method" ||
      frame.situ.closure === "function")
  ) {
    return makeReadParameterExpression("new.target", path);
  } else {
    return makeSyntaxErrorExpression("Illegal 'new.target'", path);
  }
};

//////////
// this //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     frame: import("./index").RootFrame,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootThisExpression = ({ path }, _context, { frame }) => {
  if (isExternalLocalEvalSitu(frame.situ)) {
    return makeReadParameterExpression("this", path);
  } else {
    return makeSyntaxErrorExpression("Illegal 'this'", path);
  }
};
