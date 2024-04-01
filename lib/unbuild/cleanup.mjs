import { AranError, AranSyntaxError, AranTypeError } from "../error.mjs";
import { makeThrowErrorExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeClosureBlock,
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeProgram,
  makeSequenceExpression,
} from "./node.mjs";
import {
  filterNarrow,
  map,
  compileGet,
  EMPTY,
  flatMap,
  hasNarrowObject,
} from "../util/index.mjs";
import { splitPath, walkPath } from "./path.mjs";
import {
  isBaseDeclarationPrelude,
  isBlockPrelude,
  isDuplicatePrelude,
  isEarlyErrorPrelude,
  isHeaderPrelude,
  isMetaDeclarationPrelude,
  isBodyPrelude,
  isPrefixPrelude,
  isProgramPrelude,
} from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "./sequence.mjs";

const {
  Reflect: { apply },
  Array: {
    isArray,
    prototype: { pop },
  },
} = globalThis;

const getData = compileGet("data");

/////////////
// Program //
/////////////

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
const formatMessage = (message, path, root) => {
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
 *   error: {
 *     message: string,
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     root: estree.Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => aran.Statement<unbuild.Atom>}
 */
const makeEarlyError = ({ message, path }, { root, early_syntax_error }) => {
  switch (early_syntax_error) {
    case "embed": {
      return makeEffectStatement(
        makeExpressionEffect(
          makeThrowErrorExpression(
            "SyntaxError",
            formatMessage(message, path, root),
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "throw": {
      throw new AranSyntaxError(formatMessage(message, path, root));
    }
    default: {
      throw new AranTypeError(early_syntax_error);
    }
  }
};

/**
 * @type {(
 *   duplicate: {
 *     frame: "aran.global" | "aran.record",
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     root: estree.Program,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const makeEarlyDuplicate = ({ frame, variable, path }, { root }) => {
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
                makePrimitiveExpression(variable, path),
              ],
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "SyntaxError",
                  formatMessage(
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
                  formatMessage(
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
                  formatMessage(
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
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   (
 *     | import("./prelude").HeaderPrelude
 *     | import("./prelude").EarlyErrorPrelude
 *     | import("./prelude").DuplicatePrelude
 *   )
 * >>(
 *   node: import("./sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").HeaderPrelude
 *       | import("./prelude").EarlyErrorPrelude
 *       | import("./prelude").DuplicatePrelude
 *     ),
 *     aran.Program<unbuild.Atom>,
 *   >,
 *   options: {
 *     root: estree.Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Program<unbuild.Atom>,
 * >}
 */
export const cleanupProgram = (node, options) =>
  mapSequence(
    filterSequence(node, isProgramPrelude),
    ({ sort, head, body, tag }) =>
      makeProgram(
        sort,
        [
          ...head,
          ...map(filterNarrow(listenSequence(node), isHeaderPrelude), getData),
        ],
        makeClosureBlock(
          body.frame,
          [
            ...map(
              filterNarrow(listenSequence(node), isEarlyErrorPrelude),
              ({ data }) => makeEarlyError(data, options),
            ),
            ...flatMap(
              filterNarrow(listenSequence(node), isDuplicatePrelude),
              ({ data }) => makeEarlyDuplicate(data, options),
            ),
            ...body.body,
          ],
          body.completion,
          body.tag,
        ),
        tag,
      ),
  );

///////////
// Block //
///////////

/**
 * @type {<P extends import("./prelude").BlockPrelude>(
 *   node: import("./sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").DeclarationPrelude
 *       | import("./prelude").PrefixPrelude
 *     ),
 *     aran.ControlBlock<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ControlBlock<unbuild.Atom>,
 * >}
 */
export const cleanupControlBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isBlockPrelude),
    ({ labels, frame, body, tag }) =>
      makeControlBlock(
        labels,
        [
          ...frame,
          ...map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ],
        [
          ...map(
            map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
            (node) => makeEffectStatement(node, path),
          ),
          ...body,
        ],
        tag,
      ),
  );

/**
 * @type {<P extends import("./prelude").BlockPrelude>(
 *   node: import("./sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").DeclarationPrelude
 *       | import("./prelude").PrefixPrelude
 *     ),
 *     aran.ClosureBlock<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ClosureBlock<unbuild.Atom>,
 * >}
 */
export const cleanupClosureBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isBlockPrelude),
    ({ frame, body, completion, tag }) =>
      makeClosureBlock(
        [
          ...frame,
          ...map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ],
        [
          ...map(
            map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
            (node) => makeEffectStatement(node, path),
          ),
          ...body,
        ],
        completion,
        tag,
      ),
  );

//////////
// Node //
//////////

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Statement<unbuild.Atom>[],
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const cleanupStatement = (node, path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) => [
    ...map(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      (node) => makeEffectStatement(node, path),
    ),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const cleanupEffect = (node, _path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const cleanupExpression = (node, path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) =>
    makeSequenceExpression(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      tail,
      path,
    ),
  );
