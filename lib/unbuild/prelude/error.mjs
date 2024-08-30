import { AranIllegalSyntaxError, AranTypeError } from "../../report.mjs";
import { initSequence } from "../../sequence.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "../node.mjs";
import { splitPath, walkPath } from "../../path.mjs";
import { EMPTY, hasNarrowObject } from "../../util/index.mjs";

const {
  Array: {
    isArray,
    prototype: { pop },
  },
  Reflect: { apply },
} = globalThis;

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   origin: import("../../path").Path,
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *   },
 * ) => import("../../estree").Node}
 */
const fetchOrigin = (origin, { base, root }) => {
  const segments = splitPath(origin, base);
  while (segments.length > 0) {
    const node = walkPath(segments, root);
    if (!isArray(node)) {
      return node;
    }
    apply(pop, segments, EMPTY);
  }
  return root;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   error: {
 *     message: string,
 *     origin: import("../../path").Path,
 *   },
 *   options: {
 *     root: import("../../estree").Program,
 *     base: import("../../path").Path,
 *   },
 * ) => string}
 */
export const formatErrorMessage = ({ message, origin }, options) => {
  const node = fetchOrigin(origin, options);
  const location = hasNarrowObject(node, "loc") ? node.loc : null;
  if (location == null) {
    return message;
  } else {
    return `${message} at ${location.start.line}:${location.start.column}`;
  }
};

/**
 * @type {(
 *   message: string,
 *   path: import("../../path").Path,
 * ) => import("../../sequence").Sequence<
 *   import(".").ErrorPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const initErrorExpression = (message, path) =>
  initSequence(
    [
      {
        type: "error",
        data: {
          message,
          origin: path,
        },
      },
    ],
    makePrimitiveExpression(`ARAN_EARLY_ERROR >> ${message} >> ${path}`, path),
  );

/**
 * @type {(
 *   error: import("./error").Error,
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../atom").Statement}
 */
export const makePreludeErrorStatement = (
  error,
  { early_syntax_error, ...options },
) => {
  switch (early_syntax_error) {
    case "embed": {
      // TODO: Could also be options.base?
      const path = error.origin;
      return makeEffectStatement(
        makeExpressionEffect(
          makeThrowErrorExpression(
            "SyntaxError",
            formatErrorMessage(error, options),
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "throw": {
      throw new AranIllegalSyntaxError({
        message: error.message,
        path: error.origin,
        node: fetchOrigin(error.origin, options),
      });
    }
    default: {
      throw new AranTypeError(early_syntax_error);
    }
  }
};
