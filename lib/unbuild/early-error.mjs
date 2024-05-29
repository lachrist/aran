import { AranError, AranSyntaxError, AranTypeError } from "../error.mjs";
import {
  EMPTY,
  filterNarrow,
  map,
  hasNarrowObject,
  compileGet,
  flatMap,
} from "../util/index.mjs";
import { makeThrowErrorExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeClosureBlock,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeProgram,
} from "./node.mjs";
import { splitPath, walkPath } from "../path.mjs";
import {
  isEarlyErrorPrelude,
  isNotEarlyErrorPrelude,
  makeEarlyErrorPrelude,
} from "./prelude.mjs";
import {
  filterSequence,
  initSequence,
  listenSequence,
  mapSequence,
} from "../sequence.mjs";

const {
  Array: {
    isArray,
    prototype: { pop },
  },
  Reflect: { apply },
} = globalThis;

const getData = compileGet("data");

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./early-error").EarlyError}
 */
export const makeRegularEarlyError = (message, path) => ({
  type: "regular",
  message,
  path,
});

/**
 * @type {(
 *   frame: "aran.global" | "aran.record",
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => import("./early-error").DuplicateEarlyError}
 */
export const makeDuplicateEarlyError = (frame, variable, path) => ({
  type: "duplicate",
  frame,
  variable,
  path,
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
      return `Duplicate global variable: ${error.variable}`;
    }
    default: {
      throw new AranTypeError(error);
    }
  }
};

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => error is import("./early-error").RegularEarlyError}
 */
export const isRegularEarlyError = (error) => error.type === "regular";

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => error is import("./early-error").DuplicateEarlyError}
 */
export const isDuplicateEarlyError = (error) => error.type === "duplicate";

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 * ) => import("../sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeEarlyErrorExpression = (error) =>
  initSequence(
    [makeEarlyErrorPrelude(error)],
    makeThrowErrorExpression("SyntaxError", formatMessage(error), error.path),
  );

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   path: unbuild.Path,
 *   options: {
 *     base: unbuild.Path,
 *     root: estree.Program,
 *   },
 * ) => estree.Node}
 */
const fetchOrigin = (path, { base, root }) => {
  const segments = splitPath(path, base);
  while (segments.length > 0) {
    const origin = walkPath(segments, root);
    if (!isArray(origin)) {
      return origin;
    }
    apply(pop, segments, EMPTY);
  }
  throw new AranError("missing node ancestry", { path, base, root });
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 *   options: {
 *     root: estree.Program,
 *     base: unbuild.Path,
 *   },
 * ) => string}
 */
const locateMessage = (message, path, options) => {
  const origin = fetchOrigin(path, options);
  const location = hasNarrowObject(origin, "loc") ? origin.loc : null;
  if (location == null) {
    return message;
  } else {
    return `${message} at ${location.start.line}:${location.start.column}`;
  }
};

/**
 * @type {(
 *   error: import("./early-error").RegularEarlyError,
 *   options: {
 *     base: import("../path").Path,
 *     root: estree.Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => aran.Statement<unbuild.Atom>}
 */
const reportRegularEarlyError = (error, { early_syntax_error, ...options }) => {
  const message = formatMessage(error);
  const { path } = error;
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
 *   error: import("./early-error").DuplicateEarlyError,
 *   options: {
 *     base: import("../path").Path,
 *     root: estree.Program,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const reportDuplicateEarlyError = (error, options) => {
  const message = formatMessage(error);
  const { variable, frame, path } = error;
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

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.Program<unbuild.Atom>,
 *   >,
 *   options: {
 *     base: import("../path").Path,
 *     root: estree.Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("./prelude").EarlyErrorPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").EarlyErrorPrelude>,
 *     aran.Program<unbuild.Atom>,
 *   >
 *   : unknown
 * }
 */
export const incorporateEarlyErrorProgram = (node, options) => {
  const errors = map(
    filterNarrow(listenSequence(node), isEarlyErrorPrelude),
    getData,
  );
  return mapSequence(
    filterSequence(node, isNotEarlyErrorPrelude),
    ({ kind, situ, head, body, tag }) =>
      makeProgram(
        kind,
        situ,
        head,
        makeClosureBlock(
          body.frame,
          [
            ...map(filterNarrow(errors, isRegularEarlyError), (error) =>
              reportRegularEarlyError(error, options),
            ),
            ...flatMap(filterNarrow(errors, isDuplicateEarlyError), (error) =>
              reportDuplicateEarlyError(error, options),
            ),
            ...body.body,
          ],
          body.completion,
          body.tag,
        ),
        tag,
      ),
  );
};
