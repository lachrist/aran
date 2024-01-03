import { AranTypeError } from "../../../error.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "../../early-error.mjs";
import { makeThrowMissingExpression } from "../error.mjs";
import { prependSequence } from "../../sequence.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";

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
 *   site: import("../../site").VoidSite,
 *   frame: import("./index").RootFrame,
 *   operation: import("..").LoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
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
        throw new AranTypeError(operation);
      }
    } else if (frame.situ.ambient === "external") {
      return prependSequence(
        [
          makeHeaderPrelude({
            type: "lookup",
            mode: operation.mode,
            variable: operation.variable,
          }),
        ],
        makeApplyExpression(
          makeReadExpression(`${operation.type}.${operation.mode}`, path),
          makePrimitiveExpression({ undefined: null }, path),
          [makePrimitiveExpression(operation.variable, path)],
          path,
        ),
      );
    } else {
      throw new AranTypeError(frame.situ.ambient);
    }
  } else if (operation.type === "read-import") {
    return makeReadExpression("import", path);
  } else if (operation.type === "read-this") {
    if (frame.situ.scope === "global") {
      if (frame.situ.kind === "module") {
        return makePrimitiveExpression({ undefined: null }, path);
      } else if (frame.situ.kind === "script" || frame.situ.kind === "eval") {
        return makeIntrinsicExpression("globalThis", path);
      } else {
        throw new AranTypeError(frame.situ);
      }
    } else if (frame.situ.scope === "local") {
      return makeReadExpression("this", path);
    } else {
      throw new AranTypeError(frame.situ);
    }
  } else if (operation.type === "read-import-meta") {
    if (frame.situ.root === "module") {
      return makeReadExpression("import.meta", path);
    } else if (
      frame.situ.root === "script" ||
      frame.situ.root === "global-eval"
    ) {
      return makeEarlyErrorExpression("Illegal 'import.meta'", path);
    } else {
      throw new AranTypeError(frame.situ.root);
    }
  } else if (operation.type === "read-new-target") {
    if (
      frame.situ.closure === "constructor" ||
      frame.situ.closure === "method" ||
      frame.situ.closure === "function"
    ) {
      return makeReadExpression("new.target", path);
    } else if (frame.situ.closure === "program") {
      return makeEarlyErrorExpression("Illegal 'new.target'", path);
    } else {
      throw new AranTypeError(frame.situ.closure);
    }
  } else if (operation.type === "get-super") {
    if (
      frame.situ.closure === "method" ||
      frame.situ.closure === "constructor"
    ) {
      return makeApplyExpression(
        makeReadExpression("super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(operation.key, path)],
        path,
      );
    } else if (
      frame.situ.closure === "function" ||
      frame.situ.closure === "program"
    ) {
      return makeEarlyErrorExpression("Illegal 'super' get", path);
    } else {
      throw new AranTypeError(frame.situ.closure);
    }
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (frame.situ.scope === "local") {
      if (operation.mode === "strict") {
        return prependSequence(
          [
            makeHeaderPrelude({
              type: "private",
              mode: operation.mode,
              key: operation.key,
            }),
          ],
          makeApplyExpression(
            makeReadExpression(MAPPING[operation.type], path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadCacheExpression(operation.target, path),
              makePrimitiveExpression(operation.key, path),
            ],
            path,
          ),
        );
      } else if (operation.mode === "sloppy") {
        return makeEarlyErrorExpression(
          "Illegal sloppy private operation",
          path,
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (frame.situ.scope === "global") {
      return makeEarlyErrorExpression("Illegal global private operation", path);
    } else {
      throw new AranTypeError(frame.situ);
    }
  } else if (
    operation.type === "read-error" ||
    operation.type === "read-input" ||
    operation.type === "wrap-result" ||
    operation.type === "has-template" ||
    operation.type === "get-template"
  ) {
    return makeEarlyErrorExpression(
      `Illegal root operation: ${operation.type}`,
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

//////////
// save //
//////////

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import("./index").RootFrame,
 *   operation: import("..").SaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listRootSaveEffect = ({ path }, frame, operation) => {
  if (operation.type === "write") {
    if (frame.situ.ambient === "internal") {
      if (operation.mode === "sloppy") {
        return makeExpressionEffect(
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
        );
      } else if (operation.mode === "strict") {
        return makeExpressionEffect(
          makeThrowMissingExpression(operation.variable, path),
          path,
        );
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (frame.situ.ambient === "external") {
      return prependSequence(
        [
          makeHeaderPrelude({
            type: "lookup",
            mode: operation.mode,
            variable: operation.variable,
          }),
        ],
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression(`${operation.type}.${operation.mode}`, path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(operation.variable, path),
              makeReadCacheExpression(operation.right, path),
            ],
            path,
          ),
          path,
        ),
      );
    } else {
      throw new AranTypeError(frame.situ.ambient);
    }
  } else if (operation.type === "call-super") {
    if (frame.situ.closure === "constructor") {
      return makeExpressionEffect(
        makeApplyExpression(
          makeReadExpression("super.call", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadCacheExpression(operation.input, path)],
          path,
        ),
        path,
      );
    } else if (
      frame.situ.closure === "method" ||
      frame.situ.closure === "function" ||
      frame.situ.closure === "program"
    ) {
      return listEarlyErrorEffect("Illegal 'super' call", path);
    } else {
      throw new AranTypeError(frame.situ.closure);
    }
  } else if (operation.type === "set-super") {
    if (
      frame.situ.closure === "method" ||
      frame.situ.closure === "constructor"
    ) {
      return makeExpressionEffect(
        makeApplyExpression(
          makeReadExpression("super.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(operation.key, path),
            makeReadCacheExpression(operation.value, path),
          ],
          path,
        ),
        path,
      );
    } else if (
      frame.situ.closure === "function" ||
      frame.situ.closure === "program"
    ) {
      return listEarlyErrorEffect("Illegal 'super' set", path);
    } else {
      throw new AranTypeError(frame.situ.closure);
    }
  } else if (operation.type === "set-private") {
    if (frame.situ.scope === "local") {
      if (operation.mode === "strict") {
        return prependSequence(
          [
            makeHeaderPrelude({
              type: "private",
              mode: operation.mode,
              key: operation.key,
            }),
          ],
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression("private.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(operation.target, path),
                makePrimitiveExpression(operation.key, path),
                makeReadCacheExpression(operation.value, path),
              ],
              path,
            ),
            path,
          ),
        );
      } else if (operation.mode === "sloppy") {
        return listEarlyErrorEffect("Illegal sloppy private operation", path);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else if (frame.situ.scope === "global") {
      return listEarlyErrorEffect("Illegal global private operation", path);
    } else {
      throw new AranTypeError(frame.situ);
    }
  } else if (
    operation.type === "define-private" ||
    operation.type === "register-private-singleton" ||
    operation.type === "register-private-collection" ||
    operation.type === "initialize-private" ||
    operation.type === "set-template" ||
    operation.type === "initialize"
  ) {
    return listEarlyErrorEffect(
      `Illegal root operation: ${operation.type}`,
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};
