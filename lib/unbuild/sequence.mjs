// For haskell programmers out there: this is the writer monad on lists.

import { AranTypeError } from "../error.mjs";
import {
  compileGet,
  filterNarrow,
  flatMap,
  map,
  reduce,
  reduceReverse,
  slice,
} from "../util/index.mjs";
import { collectBoundVariable } from "./collect.mjs";
import {
  makeBlockStatement,
  makeClosureBlock,
  makeConditionalExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeSequenceExpression,
  tellHeader,
  tellLog,
} from "./node.mjs";
import {
  isLogPrelude,
  isHeaderPrelude,
  isVariablePrelude,
  isHeadPrelude,
  isBodyPrelude,
} from "./prelude.mjs";

const getHead = compileGet("head");

const getTail = compileGet("tail");

/////////////
// Generic //
/////////////

/**
 * @type {<W, X>(
 *   head: W[],
 *   tail: X,
 * ) => import("./sequence.d.ts").Sequence<W, X>}
 */
export const initSequence = (head, tail) => ({
  head,
  tail,
});

/**
 * @type {<W>(
 *   tail: W[],
 * ) => import("./sequence.d.ts").Sequence<W, null>}
 */
export const tellSequence = (head) => ({ head, tail: null });

/**
 * @type {<W, X>(
 *   tail: X,
 * ) => import("./sequence.d.ts").Sequence<W, X>}
 */
export const zeroSequence = (tail) => ({ head: [], tail });

/**
 * @type {<W, X>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 * ) => import("./sequence.d.ts").Sequence<W, null>}
 */
export const dropSequence = ({ head }) => ({ head, tail: null });

/**
 * @type {<W>(
 *   sequence: import("./sequence.d.ts").Sequence<W, null>,
 * ) => W[]}
 */
export const listenSequence = ({ head }) => head;

/**
 * @type {<W, X, Y>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 *   update: (tail: X) => Y,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const mapSequence = ({ head, tail }, update) => ({
  head,
  tail: update(tail),
});

/**
 * @type {<W, X1, X2, Y>(
 *   sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 *   combine: (tail1: X1, tail2: X2) => Y,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const mapTwoSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  combine,
) => ({
  head: [...head1, ...head2],
  tail: combine(tail1, tail2),
});

/**
 * @type {<W, X1, X2, X3, Y>(
 *   sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W, X3>,
 *   combine: (tail1: X1, tail2: X2, tail3: X3) => Y,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const mapThreeSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  combine,
) => ({
  head: [...head1, ...head2, ...head3],
  tail: combine(tail1, tail2, tail3),
});

/**
 * @type {<W, X1, X2, X3, X4, Y>(
 *   sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W, X4>,
 *   combine: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const mapFourSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
  combine,
) => ({
  head: [...head1, ...head2, ...head3, ...head4],
  tail: combine(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, W2, X>(
 *   sequence: import("./sequence.d.ts").Sequence<W1, X>,
 *   update: (head: W1) => W2,
 * ) => import("./sequence.d.ts").Sequence<W2, X>}
 */
export const passSequence = ({ head, tail }, update) => ({
  head: map(head, update),
  tail,
});

/**
 * @type {<W, X, Y>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 *   kontinue: (
 *     tail: X,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const bindSequence = ({ head: head1, tail: tail1 }, kontinue) => {
  const { head, tail } = kontinue(tail1);
  return { head: [...head1, ...head], tail };
};

/**
 * @type {<W, X1, X2, Y>(
 *   sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 *   kontinue: (
 *     tail1: X1,
 *     tail2: X2,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const bindTwoSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  kontinue,
) => {
  const { head, tail } = kontinue(tail1, tail2);
  return { head: [...head1, ...head2, ...head], tail };
};

/**
 * @type {<W, X1, X2, X3, Y>(
 *   sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W, X3>,
 *   kontinue: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const bindThreeSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  kontinue,
) => {
  const { head, tail } = kontinue(tail1, tail2, tail3);
  return { head: [...head1, ...head2, ...head3, ...head], tail };
};

/**
 * @type {<W, X1, X2>(
 *  Sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *  Sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 * ) => import("./sequence.d.ts").Sequence<W, X2>}
 */
export const thenSequence = (
  { head: head1 },
  { head: head2, tail: tail2 },
) => ({
  head: [...head1, ...head2],
  tail: tail2,
});

/**
 * @type {<W, X>(
 *   sequences: import("./sequence.d.ts").Sequence<W, X>[],
 * ) => import("./sequence.d.ts").Sequence<W, X[]>}
 */
export const flatSequence = (sequences) => ({
  head: flatMap(sequences, getHead),
  tail: map(sequences, getTail),
});

// /**
//  * @type {<W, X>(
//  *   sequence: Sequence<W, X>,
//  *   kontinue: (tail: X) => W[],
//  * ) => W[]}
//  */
// export const nullSequence = ({ head, tail }, kontinue) => [
//   ...head,
//   ...kontinue(tail),
// ];

//////////////
// Specific //
//////////////

/**
 * @type {(
 *   sequence: import("./sequence.d.ts").EffectSequence<aran.Expression<unbuild.Atom>>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const sequenceExpression = ({ head, tail }, path) =>
  makeSequenceExpression(head, tail, path);

/**
 * @type {(
 *   sequence: import("./sequence.d.ts").ConditionSequence<
 *     aran.Expression<unbuild.Atom>
 *   >,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const sequenceCondition = ({ head, tail }, path) =>
  reduceReverse(
    head,
    (next, chain) => {
      switch (chain.type) {
        case "effect": {
          return makeSequenceExpression([chain.node], next, path);
        }
        case "condition": {
          return makeConditionalExpression(chain.test, chain.exit, next, path);
        }
        default: {
          throw new AranTypeError("invalid chain", chain);
        }
      }
    },
    tail,
  );

const getData = compileGet("data");

/**
 * @type {(
 *   sequence: import("./sequence.d.ts").PreludeSequence<
 *     aran.Expression<unbuild.Atom>
 *   >,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const sequenceClosureBlock = ({ head, tail: completion }, path) => {
  const logs = map(filterNarrow(head, isLogPrelude), getData);
  const headers = map(filterNarrow(head, isHeaderPrelude), getData);
  const variables1 = map(filterNarrow(head, isVariablePrelude), getData);
  const statements = map(
    [
      ...filterNarrow(head, isHeadPrelude),
      ...filterNarrow(head, isBodyPrelude),
    ],
    getData,
  );
  const variables2 = collectBoundVariable([...statements, completion]);
  return reduce(
    headers,
    tellHeader,
    reduce(
      logs,
      tellLog,
      makeClosureBlock(
        [...variables1, ...variables2],
        statements,
        completion,
        path,
      ),
    ),
  );
};

/**
 * @type {(
 *   sequence: import("./sequence.d.ts").PreludeSequence<null>,
 *   labels: unbuild.Label[],
 *   path: unbuild.Path,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const sequenceControlBlock = ({ head }, labels, path) => {
  const logs = map(filterNarrow(head, isLogPrelude), getData);
  const headers = map(filterNarrow(head, isHeaderPrelude), getData);
  const variables1 = map(filterNarrow(head, isVariablePrelude), getData);
  const statements = map(
    [
      ...filterNarrow(head, isHeadPrelude),
      ...filterNarrow(head, isBodyPrelude),
    ],
    getData,
  );
  const variables2 = collectBoundVariable(statements);
  return reduce(
    headers,
    tellHeader,
    reduce(
      logs,
      tellLog,
      makeControlBlock(
        labels,
        [...variables1, ...variables2],
        statements,
        path,
      ),
    ),
  );
};

/**
 * @type {(
 *   sequence: import("./sequence.d.ts").PreludeSequence<null>,
 *   labels: unbuild.Label[],
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const sequenceControlStatement = ({ head }, labels, path) => {
  const logs = map(filterNarrow(head, isLogPrelude), getData);
  const headers = map(filterNarrow(head, isHeaderPrelude), getData);
  const variables1 = map(filterNarrow(head, isVariablePrelude), getData);
  const statements = map(
    [
      ...filterNarrow(head, isHeadPrelude),
      ...filterNarrow(head, isBodyPrelude),
    ],
    getData,
  );
  const variables2 = collectBoundVariable(statements);
  const variables = [...variables1, ...variables2];
  if (variables.length === 0) {
    if (logs.length === 0 && headers.length === 0) {
      return statements;
    } else {
      if (statements.length === 0) {
        return [
          reduce(
            headers,
            tellHeader,
            reduce(
              logs,
              tellLog,
              makeEffectStatement(
                makeExpressionEffect(
                  makePrimitiveExpression({ undefined: null }, path),
                  path,
                ),
                path,
              ),
            ),
          ),
        ];
      } else {
        return [
          reduce(headers, tellHeader, reduce(logs, tellLog, statements[0])),
          ...slice(statements, 1, statements.length),
        ];
      }
    }
  } else {
    return [
      makeBlockStatement(
        makeControlBlock(labels, variables, statements, path),
        path,
      ),
    ];
  }
};
