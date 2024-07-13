import { AranSyntaxError, AranTypeError } from "../../error.mjs";
import { EMPTY, hasNarrowObject } from "../../util/index.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { splitPath, walkPath } from "../../path.mjs";
import { makeEarlyErrorPrelude } from "./prelude.mjs";
import { initSequence } from "../../sequence.mjs";

const {
  Array: {
    isArray,
    prototype: { pop },
  },
  Reflect: { apply },
} = globalThis;

/**
 * @type {(
 *   message: string,
 *   origin: import("../../path").Path,
 * ) => import("./early-error").StaticEarlyError}
 */
export const makeRegularEarlyError = (message, origin) => ({
  type: "regular",
  message,
  origin,
});

/**
 * @type {(
 *   frame: "aran.global" | "aran.record",
 *   variable: import("../../estree").Variable,
 *   origin: import("../../path").Path,
 * ) => import("./early-error").DynamicEarlyError}
 */
export const makeDynamicDuplicateEarlyError = (frame, variable, origin) => ({
  type: "duplicate",
  frame,
  variable,
  origin,
});

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 *   origin: import("../../path").Path,
 * ) => import("./early-error").StaticEarlyError}
 */
export const makeStaticDuplicateEarlyError = (variable, origin) => ({
  type: "duplicate",
  frame: "static",
  variable,
  origin,
});

/**
 * @type {(
 *   binding: {
 *     cause: "duplicate" | "keyword",
 *     variable: import("../../estree").Variable,
 *     origin: import("../../path").Path,
 *   },
 * ) => import("./early-error").EarlyError}
 */
export const toBindingEarlyError = ({ cause, variable, origin }) => ({
  type: "regular",
  message: `${cause} variable: ${variable}`,
  origin,
});

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => string}
 */
const formatMessage = (error) => {
  switch (error.type) {
    case "regular": {
      return error.message;
    }
    case "duplicate": {
      return `Duplicate variable: ${error.variable}`;
    }
    default: {
      throw new AranTypeError(error);
    }
  }
};

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => string}
 */
const showEarlyError = (error) =>
  `ARAN_EARLY_ERROR >> ${formatMessage(error)} >> ${error.origin}`;

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => error is import("./early-error").StaticEarlyError}
 */
export const isStaticEarlyError = (error) =>
  error.type === "regular" ||
  (error.type === "duplicate" && error.frame === "static");

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => error is import("./early-error").DynamicEarlyError}
 */
export const isDynamicEarlyError = (error) =>
  error.type === "duplicate" &&
  (error.frame === "aran.global" || error.frame === "aran.record");

/**
 * @type {(
 *   error: import("./early-error").StaticEarlyError,
 * ) => import("../../sequence").Sequence<
 *   import(".").EarlyErrorPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const makeEarlyErrorExpression = (error) =>
  initSequence(
    [makeEarlyErrorPrelude(error)],
    makePrimitiveExpression(showEarlyError(error), error.origin),
  );

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
 *   message: string,
 *   origin: import("../../path").Path,
 *   options: {
 *     root: import("../../estree").Program,
 *     base: import("../../path").Path,
 *   },
 * ) => string}
 */
const locateMessage = (message, origin, options) => {
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
 *   error: import("./early-error").StaticEarlyError,
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../atom").Statement}
 */
export const reportStaticEarlyError = (
  error,
  { early_syntax_error, ...options },
) => {
  const message = formatMessage(error);
  const { origin: path } = error;
  switch (early_syntax_error) {
    case "embed": {
      return makeEffectStatement(
        makeExpressionEffect(
          makeThrowErrorExpression(
            "SyntaxError",
            locateMessage(message, path, options),
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "throw": {
      throw new AranSyntaxError(locateMessage(message, path, options));
    }
    default: {
      throw new AranTypeError(early_syntax_error);
    }
  }
};

/**
 * @type {(
 *   error: import("./early-error").DynamicEarlyError,
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *   },
 * ) => import("../atom").Statement[]}
 */
export const reportDynamicEarlyError = (error, options) => {
  const message = formatMessage(error);
  const { variable, frame, origin: path } = error;
  switch (frame) {
    case "aran.global": {
      return [
        makeEffectStatement(
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeIntrinsicExpression("aran.record", path),
                makePrimitiveExpression(error.variable, path),
              ],
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "SyntaxError",
                  locateMessage(message, path, options),
                  path,
                ),
                path,
              ),
            ],
            EMPTY,
            path,
          ),
          path,
        ),
      ];
    }
    case "aran.record": {
      return [
        makeEffectStatement(
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", path),
              makeIntrinsicExpression("undefined", path),
              [
                makeIntrinsicExpression("aran.record", path),
                makePrimitiveExpression(variable, path),
              ],
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "SyntaxError",
                  locateMessage(
                    `Duplicate global variable: ${variable}`,
                    path,
                    options,
                  ),
                  path,
                ),
                path,
              ),
            ],
            EMPTY,
            path,
          ),
          path,
        ),
        makeEffectStatement(
          makeConditionalEffect(
            makeConditionalExpression(
              makeApplyExpression(
                // Reflect.getOwnPropertyDescriptor instead of Object.hasOwn
                // https://github.com/nodejs/node/issues/52720
                makeIntrinsicExpression(
                  "Reflect.getOwnPropertyDescriptor",
                  path,
                ),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(variable, path),
                ],
                path,
              ),
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.get", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression(
                      "Reflect.getOwnPropertyDescriptor",
                      path,
                    ),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeIntrinsicExpression("aran.global", path),
                      makePrimitiveExpression(variable, path),
                    ],
                    path,
                  ),
                  makePrimitiveExpression("configurable", path),
                ],
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
            EMPTY,
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "SyntaxError",
                  locateMessage(
                    `Duplicate global variable: ${variable}`,
                    path,
                    options,
                  ),
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError(frame);
    }
  }
};
