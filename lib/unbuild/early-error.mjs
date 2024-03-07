import { splitPath, walkPath } from "./path.mjs";
import { makeThrowErrorExpression } from "./intrinsic.mjs";
import {
  concatStatement,
  makeEffectStatement,
  makeExpressionEffect,
  prependClosureBody,
} from "./node.mjs";
import {
  isEarlyErrorPrelude,
  isNotEarlyErrorPrelude,
  makeEarlyErrorPrelude,
} from "./prelude.mjs";
import {
  filterSequence,
  initSequence,
  listenSequence,
  prependSequence,
} from "./sequence.mjs";
import { AranError, AranSyntaxError } from "../error.mjs";
import { filterNarrow, hasNarrowObject, map } from "../util/index.mjs";

const {
  Reflect: { apply },
  Array: {
    isArray,
    prototype: { pop },
  },
} = globalThis;

/** @type {[]} */
const EMPTY = [];

/**
 * @type {<X>(
 *  value: X,
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   import("./prelude").EarlyErrorPrelude,
 *   X,
 * >}
 */
export const makeEarlyError = (value, message, path) =>
  initSequence([makeEarlyErrorPrelude({ message, path })], value);

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
 *   error: import("./early-error").EarlyError,
 *   root: estree.Program,
 * ) => string}
 */
const formatMessage = ({ path, message }, root) => {
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
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeEarlyErrorExpression = (message, path) =>
  prependSequence(
    [makeEarlyErrorPrelude({ message, path })],
    makeThrowErrorExpression("SyntaxError", message, path),
  );

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const listEarlyErrorEffect = (message, path) =>
  makeExpressionEffect(makeEarlyErrorExpression(message, path), path);

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const listEarlyErrorStatement = (message, path) =>
  makeEffectStatement(listEarlyErrorEffect(message, path), path);

/**
 * @type {(
 *   error: import("./early-error").EarlyError,
 *   mode: "embed" | "throw",
 *   root: estree.Program,
 * ) => import("./sequence").Sequence<
 *   never,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const reportEarlyError = (error, mode, root) => {
  const { path } = error;
  const message = formatMessage(error, root);
  switch (mode) {
    case "embed": {
      return makeEffectStatement(
        makeExpressionEffect(
          makeThrowErrorExpression("SyntaxError", message, path),
          path,
        ),
        path,
      );
    }
    case "throw": {
      throw new AranSyntaxError(message);
    }
    default: {
      throw new AranError("invalid mode", { mode });
    }
  }
};

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   body: import("./sequence").Sequence<
 *     P,
 *     import("./body").ClosureBody<unbuild.Atom>,
 *   >,
 *   mode: "embed" | "throw",
 *   root: estree.Program,
 * ) => import("./sequence").Sequence<
 *   Exclude<P, import("./prelude").EarlyErrorPrelude>,
 *   import("./body").ClosureBody<unbuild.Atom>,
 * >}
 */
export const setupEarlyError = (body, mode, root) =>
  prependClosureBody(
    concatStatement(
      map(
        filterNarrow(listenSequence(body), isEarlyErrorPrelude),
        ({ data: error }) => reportEarlyError(error, mode, root),
      ),
    ),
    filterSequence(body, isNotEarlyErrorPrelude),
  );
