import { AranTypeError } from "../../../error.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  listEarlyErrorEffect,
  makeEarlyErrorExpression,
} from "../../early-error.mjs";
import { makeThrowMissingExpression } from "../error.mjs";
import { getRootContextMode, getRootContextScope } from "../../../context.mjs";
import {
  makeLoadLookupExpression,
  makeLoadStraightExpression,
  makeLoadPrivateExpression,
  makeSaveLookupEffect,
  makeSavePrivateEffect,
} from "./parameter.mjs";
import { includes } from "../../../util/index.mjs";

/** @type {Record<import(".").RootFrame["type"], null>} */
export const ROOT = {
  root: null,
};

const MAPPING = {
  "has-private": /** @type {"has"} */ ("has"),
  "get-private": /** @type {"get"} */ ("get"),
};

/**
 * @type {(frame: import(".").RootFrame) => "strict" | "sloppy"}
 */
export const getRootMode = ({ context }) => getRootContextMode(context);

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
export const makeRootLoadExpression = ({ path }, { context }, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    const scope = getRootContextScope(context);
    if (scope === "reify") {
      if (operation.type === "read") {
        return makeThrowMissingExpression(operation.variable, path);
      } else if (operation.type === "typeof") {
        return makePrimitiveExpression("undefined", path);
      } else if (operation.type === "discard") {
        return makePrimitiveExpression(true, path);
      } else {
        throw new AranTypeError(operation);
      }
    } else if (scope === "alien") {
      return makeLoadLookupExpression(
        operation.type,
        operation.mode,
        operation.variable,
        path,
      );
    } else {
      throw new AranTypeError(scope);
    }
  } else if (operation.type === "read-import-dynamic") {
    return makeLoadStraightExpression("import.dynamic", path);
  } else if (operation.type === "read-this") {
    if (context.source === "module") {
      return makePrimitiveExpression({ undefined: null }, path);
    } else if (
      context.source === "script" ||
      context.source === "global-eval"
    ) {
      return makeIntrinsicExpression("globalThis", path);
    } else if (context.source === "local-eval") {
      return makeLoadStraightExpression("this", path);
    } else {
      throw new AranTypeError(context);
    }
  } else if (operation.type === "read-import-meta") {
    if (
      context.source === "module" ||
      (context.source === "local-eval" &&
        includes(context.scope, "import.meta"))
    ) {
      return makeLoadStraightExpression("import.meta", path);
    } else {
      return makeEarlyErrorExpression("Illegal 'import.meta'", path);
    }
  } else if (operation.type === "read-new-target") {
    if (
      context.source === "local-eval" &&
      includes(context.scope, "new.target")
    ) {
      return makeLoadStraightExpression("new.target", path);
    } else {
      return makeEarlyErrorExpression("Illegal 'new.target'", path);
    }
  } else if (operation.type === "get-super") {
    if (
      context.source === "local-eval" &&
      includes(context.scope, "super.get")
    ) {
      return makeApplyExpression(
        makeLoadStraightExpression("super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(operation.key, path)],
        path,
      );
    } else {
      return makeEarlyErrorExpression("Illegal 'super' get", path);
    }
  } else if (
    operation.type === "get-private" ||
    operation.type === "has-private"
  ) {
    if (context.source === "local-eval") {
      return makeLoadPrivateExpression(
        MAPPING[operation.type],
        operation.key,
        path,
      );
    } else {
      return makeEarlyErrorExpression("Illegal global private operation", path);
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
export const listRootSaveEffect = ({ path }, { context }, operation) => {
  if (operation.type === "write") {
    const scope = getRootContextScope(context);
    if (scope === "reify") {
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
    } else if (scope === "alien") {
      return makeSaveLookupEffect(
        operation.type,
        operation.mode,
        operation.variable,
        makeReadCacheExpression(operation.right, path),
        path,
      );
    } else {
      throw new AranTypeError(scope);
    }
  } else if (operation.type === "call-super") {
    if (
      context.source === "local-eval" &&
      includes(context.scope, "super.call")
    ) {
      return makeExpressionEffect(
        makeApplyExpression(
          makeLoadStraightExpression("super.call", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadCacheExpression(operation.input, path)],
          path,
        ),
        path,
      );
    } else {
      return listEarlyErrorEffect("Illegal 'super' call", path);
    }
  } else if (operation.type === "set-super") {
    if (
      context.source === "local-eval" &&
      includes(context.scope, "super.set")
    ) {
      return makeExpressionEffect(
        makeApplyExpression(
          makeLoadStraightExpression("super.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(operation.key, path),
            makeReadCacheExpression(operation.value, path),
          ],
          path,
        ),
        path,
      );
    } else {
      return listEarlyErrorEffect("Illegal 'super' set", path);
    }
  } else if (operation.type === "set-private") {
    if (context.source === "local-eval") {
      if (operation.mode === "strict") {
        return makeSavePrivateEffect(
          "set",
          operation.key,
          makeReadCacheExpression(operation.value, path),
          path,
        );
      } else if (operation.mode === "sloppy") {
        return listEarlyErrorEffect("Illegal sloppy private operation", path);
      } else {
        throw new AranTypeError(operation.mode);
      }
    } else {
      return listEarlyErrorEffect("Illegal global private operation", path);
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
