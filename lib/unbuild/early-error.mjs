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
import { splitPath, walkPath } from "./path.mjs";
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
} from "./sequence.mjs";

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
 * ) => import("./sequence").Sequence<
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
 *   root: estree.Program,
 * ) => estree.Node}
 */
const fetchOrigin = (path, root) => {
  const segments = splitPath(path);
  while (segments.length > 0) {
    const origin = walkPath(segments, root);
    if (!isArray(origin)) {
      return origin;
    }
    apply(pop, segments, EMPTY);
  }
  throw new AranError("missing node ancestry", { path, root });
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 *   root: estree.Program,
 * ) => string}
 */
const locateMessage = (message, path, root) => {
  const origin = fetchOrigin(path, root);
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
 *     root: estree.Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => aran.Statement<unbuild.Atom>}
 */
const reportRegularEarlyError = (error, { root, early_syntax_error }) => {
  const message = formatMessage(error);
  const { path } = error;
  switch (early_syntax_error) {
    case "embed": {
      return makeEffectStatement(
        makeExpressionEffect(
          makeThrowErrorExpression(
            "SyntaxError",
            locateMessage(message, path, root),
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "throw": {
      throw new AranSyntaxError(locateMessage(message, path, root));
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
 *     root: estree.Program,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const reportDuplicateEarlyError = (error, { root }) => {
  const message = formatMessage(error);
  const { variable, frame, path } = error;
  switch (frame) {
    case "aran.global": {
      return [
        makeEffectStatement(
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", path),
              makePrimitiveExpression({ undefined: null }, path),
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
                  locateMessage(message, path, root),
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
                makeIntrinsicExpression("Object.hasOwn", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(variable, path),
                ],
                path,
              ),
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.get", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression(
                      "Reflect.getOwnPropertyDescriptor",
                      path,
                    ),
                    makePrimitiveExpression({ undefined: null }, path),
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
              makePrimitiveExpression(false, path),
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "SyntaxError",
                  locateMessage(
                    `Duplicate global variable: ${variable}`,
                    path,
                    root,
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
      ];
    }
    case "aran.record": {
      return [
        makeEffectStatement(
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", path),
              makePrimitiveExpression({ undefined: null }, path),
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
                    root,
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
      ];
    }
    default: {
      throw new AranTypeError(frame);
    }
  }
};

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("./sequence").Sequence<
 *     P,
 *     aran.Program<unbuild.Atom>,
 *   >,
 *   options: {
 *     root: estree.Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("./prelude").EarlyErrorPrelude extends P
 *   ? import("./sequence").Sequence<
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
    ({ sort, head, body, tag }) =>
      makeProgram(
        sort,
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
