import { AranTypeError } from "../../../error.mjs";
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

const MAPPING = {
  "has-private": /** @type {"private.has"} */ ("private.has"),
  "get-private": /** @type {"private.get"} */ ("private.get"),
};

/**
 * @type {(frame: import(".").RootFrame) => "strict" | "sloppy"}
 */
export const getRootMode = (frame) => frame.situ.mode;

//////////
// load //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import("./index").RootFrame,
 *   operation: import("..").LoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootLoadExpression = ({ path }, frame, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    if (frame.situ.ambient === "internal") {
      if (operation.type === "read") {
        return makeThrowMissingExpression(operation.variable, path);
      } else if (operation.type === "typeof") {
        return makePrimitiveExpression("undefined", path);
      } else if (operation.type === "discard") {
        return makePrimitiveExpression(true, path);
      } else {
        throw new AranTypeError("invalid operation", operation);
      }
    } else if (frame.situ.ambient === "external") {
      return tellHeader(
        makeApplyExpression(
          makeReadParameterExpression(
            `${operation.type}.${operation.mode}`,
            path,
          ),
          makePrimitiveExpression({ undefined: null }, path),
          [makePrimitiveExpression(operation.variable, path)],
          path,
        ),
        {
          type: "lookup",
          mode: operation.mode,
          variable: operation.variable,
        },
      );
    } else {
      throw new AranTypeError("invalid situ", frame.situ.ambient);
    }
  } else if (operation.type === "read-import") {
    return makeReadParameterExpression("import", path);
  } else if (operation.type === "read-this") {
    if (frame.situ.scope === "global") {
      if (frame.situ.kind === "module") {
        return makePrimitiveExpression({ undefined: null }, path);
      } else if (frame.situ.kind === "script" || frame.situ.kind === "eval") {
        return makeIntrinsicExpression("globalThis", path);
      } else {
        throw new AranTypeError("invalid situ", frame.situ);
      }
    } else if (frame.situ.scope === "local") {
      return makeReadParameterExpression("this", path);
    } else {
      throw new AranTypeError("invalid situ", frame.situ);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.situ.root === "module") {
      return makeReadParameterExpression("import.meta", path);
    } else if (
      frame.situ.root === "script" ||
      frame.situ.root === "global-eval"
    ) {
      return makeSyntaxErrorExpression("Illegal 'import.meta'", path);
    } else {
      throw new AranTypeError("invalid situ.root", frame.situ.root);
    }
  } else if (operation.type === "read-new-target") {
    if (
      frame.situ.closure === "constructor" ||
      frame.situ.closure === "method" ||
      frame.situ.closure === "function"
    ) {
      return makeReadParameterExpression("new.target", path);
    } else if (frame.situ.closure === "program") {
      return makeSyntaxErrorExpression("Illegal 'new.target'", path);
    } else {
      throw new AranTypeError("invalid situ.closure", frame.situ.closure);
    }
  } else if (operation.type === "get-super") {
    if (
      frame.situ.closure === "method" ||
      frame.situ.closure === "constructor"
    ) {
      return makeApplyExpression(
        makeReadParameterExpression("super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(operation.key, path)],
        path,
      );
    } else if (
      frame.situ.closure === "function" ||
      frame.situ.closure === "program"
    ) {
      return makeSyntaxErrorExpression("Illegal 'super' get", path);
    } else {
      throw new AranTypeError("invalid situ.closure", frame.situ.closure);
    }
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (frame.situ.scope === "local") {
      if (operation.mode === "strict") {
        return tellHeader(
          makeApplyExpression(
            makeReadParameterExpression(MAPPING[operation.type], path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadCacheExpression(operation.target, path),
              makePrimitiveExpression(operation.key, path),
            ],
            path,
          ),
          {
            type: "private",
            mode: operation.mode,
            key: operation.key,
          },
        );
      } else if (operation.mode === "sloppy") {
        return makeSyntaxErrorExpression(
          "Illegal sloppy private operation",
          path,
        );
      } else {
        throw new AranTypeError("invalid operation.mode", operation.mode);
      }
    } else if (frame.situ.scope === "global") {
      return makeSyntaxErrorExpression(
        "Illegal global private operation",
        path,
      );
    } else {
      throw new AranTypeError("invalid situ", frame.situ);
    }
  } else if (
    operation.type === "read-error" ||
    operation.type === "read-input" ||
    operation.type === "wrap-result"
  ) {
    return makeSyntaxErrorExpression(
      `Illegal root operation: ${operation.type}`,
      path,
    );
  } else {
    throw new AranTypeError("invalid operation.type", operation);
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
 *   frame: import("./index").RootFrame,
 *   operation: import("..").SaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRootSaveEffect = ({ path }, frame, operation) => {
  if (operation.type === "write") {
    if (frame.situ.ambient === "internal") {
      if (operation.mode === "sloppy") {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeIntrinsicExpression("aran.global", path),
                makePrimitiveExpression(operation.variable, path),
                makeReadCacheExpression(operation.right, path),
              ],
              path,
            ),
            path,
          ),
        ];
      } else if (operation.mode === "strict") {
        return [
          makeExpressionEffect(
            makeThrowMissingExpression(operation.variable, path),
            path,
          ),
        ];
      } else {
        throw new AranTypeError("invalid mode", operation.mode);
      }
    } else if (frame.situ.ambient === "external") {
      return [
        makeExpressionEffect(
          tellHeader(
            makeApplyExpression(
              makeReadParameterExpression(
                `${operation.type}.${operation.mode}`,
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makePrimitiveExpression(operation.variable, path),
                makeReadCacheExpression(operation.right, path),
              ],
              path,
            ),
            {
              type: "lookup",
              mode: operation.mode,
              variable: operation.variable,
            },
          ),
          path,
        ),
      ];
    } else {
      throw new AranTypeError("invalid situ.ambient", frame.situ.ambient);
    }
  } else if (operation.type === "initialize") {
    return [
      makeExpressionEffect(
        makeSyntaxErrorExpression("Illegal root initialization", path),
        path,
      ),
    ];
  } else if (operation.type === "call-super") {
    if (frame.situ.closure === "constructor") {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeReadParameterExpression("super.call", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makeReadCacheExpression(operation.input, path)],
            path,
          ),
          path,
        ),
      ];
    } else if (
      frame.situ.closure === "method" ||
      frame.situ.closure === "function" ||
      frame.situ.closure === "program"
    ) {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal 'super' call", path),
          path,
        ),
      ];
    } else {
      throw new AranTypeError("invalid closure", frame.situ.closure);
    }
  } else if (operation.type === "set-super") {
    if (
      frame.situ.closure === "method" ||
      frame.situ.closure === "constructor"
    ) {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeReadParameterExpression("super.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadCacheExpression(operation.key, path),
              makeReadCacheExpression(operation.value, path),
            ],
            path,
          ),
          path,
        ),
      ];
    } else if (
      frame.situ.closure === "function" ||
      frame.situ.closure === "program"
    ) {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal 'super' set", path),
          path,
        ),
      ];
    } else {
      throw new AranTypeError("invalid situ.closure", frame.situ.closure);
    }
  } else if (operation.type === "set-private") {
    if (frame.situ.scope === "local") {
      if (operation.mode === "strict") {
        return [
          makeExpressionEffect(
            tellHeader(
              makeApplyExpression(
                makeReadParameterExpression("private.set", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(operation.target, path),
                  makePrimitiveExpression(operation.key, path),
                  makeReadCacheExpression(operation.value, path),
                ],
                path,
              ),
              {
                type: "private",
                mode: operation.mode,
                key: operation.key,
              },
            ),
            path,
          ),
        ];
      } else if (operation.mode === "sloppy") {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression("Illegal sloppy private operation", path),
            path,
          ),
        ];
      } else {
        throw new AranTypeError("invalid operation.mode", operation.mode);
      }
    } else if (frame.situ.scope === "global") {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("Illegal global private operation", path),
          path,
        ),
      ];
    } else {
      throw new AranTypeError("invalid situ", frame.situ);
    }
  } else if (
    operation.type === "define-private" ||
    operation.type === "register-private" ||
    operation.type === "initialize-private"
  ) {
    return [
      makeExpressionEffect(
        makeSyntaxErrorExpression(
          `Illegal root operation: ${operation.type}`,
          path,
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid operation", operation);
  }
};
