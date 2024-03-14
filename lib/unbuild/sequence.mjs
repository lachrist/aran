// For haskell programmers out there: this is the writer monad on lists.

import {
  EMPTY,
  compileGet,
  filterNarrow,
  flatMap,
  map,
} from "../util/index.mjs";

const getHead = compileGet("head");

const getTail = compileGet("tail");

/**
 * @type {import("./sequence").Sequence<never, never[]>}
 */
export const EMPTY_SEQUENCE = { head: EMPTY, tail: EMPTY };

export const NULL_SEQUENCE = { head: EMPTY, tail: null };

/////////////
// Generic //
/////////////

/**
 * @type {<W, X>(
 *   head: W[],
 *   tail: X,
 * ) => import("./sequence").Sequence<W, X>}
 */
export const initSequence = (head, tail) => ({
  head,
  tail,
});

/**
 * @type {<W1, W2, X>(
 *  head: W1[],
 *  sequence: import("./sequence").Sequence<W2, X>,
 * ) => import("./sequence").Sequence<W1 | W2, X>}
 */
export const prependSequence = (head1, { head: head2, tail }) => ({
  head: [...head1, ...head2],
  tail,
});

/**
 * @type {<W1, W2, X>(
 *  head: W1[],
 *  sequence: import("./sequence").Sequence<W2, X>,
 * ) => import("./sequence").Sequence<W1 | W2, X>}
 */
export const appendSequence = (head2, { head: head1, tail }) => ({
  head: [...head1, ...head2],
  tail,
});

/**
 * @type {<W, V extends W, X>(
 *   sequence: import("./sequence").Sequence<W, X>,
 *   predicate: (word: W) => word is V,
 * ) => import("./sequence").Sequence<V, X>}
 */
export const filterSequence = ({ head, tail }, predicate) => ({
  head: filterNarrow(head, predicate),
  tail,
});

/**
 * @type {<W>(
 *   tail: W[],
 * ) => import("./sequence").Sequence<W, null>}
 */
export const tellSequence = (head) => ({ head, tail: null });

/**
 * @type {<X>(
 *   tail: X,
 * ) => import("./sequence").Sequence<never, X>}
 */
export const zeroSequence = (tail) => ({ head: [], tail });

/**
 * @type {<W, X>(
 *   sequence: import("./sequence").Sequence<W, X>,
 * ) => import("./sequence").Sequence<W, null>}
 */
export const dropSequence = ({ head }) => ({ head, tail: null });

/**
 * @type {<W, X>(
 *   sequence: import("./sequence").Sequence<W, X>,
 * ) => W[]}
 */
export const listenSequence = ({ head }) => head;

/**
 * @type {<W, X, Y>(
 *   mappee: import("./sequence").Sequence<W, X>,
 *   update: (tail: X) => Y,
 * ) => import("./sequence").Sequence<W, Y>}
 */
export const mapSequence = ({ head, tail }, update) => ({
  head,
  tail: update(tail),
});

/**
 * @type {<W1, W2, X, Y>(
 *   sequence: import("./sequence").Sequence<W1, X>,
 *   kontinue: (
 *     tail: X,
 *   ) => import("./sequence").Sequence<W2, Y>,
 * ) => import("./sequence").Sequence<W1 | W2, Y>}
 */
export const bindSequence = ({ head: head1, tail: tail1 }, kontinue) => {
  const { head, tail } = kontinue(tail1);
  return { head: [...head1, ...head], tail };
};

/**
 * @type {<W1, W2, X1, X2>(
 *  sequence1: import("./sequence").Sequence<W1, X1>,
 *  sequence2: import("./sequence").Sequence<W2, X2>,
 * ) => import("./sequence").Sequence<W1 | W2, X2>}
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
 *   sequences: import("./sequence").Sequence<W, X>[],
 * ) => import("./sequence").Sequence<W, X[]>}
 */
export const flatSequence = (sequences) => ({
  head: flatMap(sequences, getHead),
  tail: map(sequences, getTail),
});

//////////
// Lift //
//////////

/**
 * @type {<X1, Y>(
 *   liftee: (tail: X1) => Y,
 *   pure1: X1,
 * ) => import("./sequence").Sequence<never, Y>}
 */
export const liftSequence_ = (liftee, tail) => ({
  head: [],
  tail: liftee(tail),
});

/**
 * @type {<W1, X1, Y>(
 *   liftee: (tail1: X1) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 * ) => import("./sequence").Sequence<W1, Y>}
 */
export const liftSequenceX = (liftee, { head: head1, tail: tail1 }) => ({
  head: head1,
  tail: liftee(tail1),
});

/**
 * @type {<W1, W2, X1, X2, Y>(
 *   liftee: (tail1: X1, tail2: X2) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 * ) => import("./sequence").Sequence<W1 | W2, Y>}
 */
export const liftSequenceXX = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
) => ({
  head: [...head1, ...head2],
  tail: liftee(tail1, tail2),
});

/**
 * @type {<W2, X1, X2, Y>(
 *   liftee: (tail1: X1, tail2: X2) => Y,
 *   sequence1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 * ) => import("./sequence").Sequence<W2, Y>}
 */
export const liftSequence_X = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
) => ({
  head: head2,
  tail: liftee(tail1, tail2),
});

/**
 * @type {<W1, X1, X2, Y>(
 *   liftee: (tail1: X1, tail2: X2) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 * ) => import("./sequence").Sequence<W1, Y>}
 */
export const liftSequenceX_ = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
) => ({
  head: head1,
  tail: liftee(tail1, tail2),
});

/**
 * @type {<X1, X2, Y>(
 *   liftee: (tail1: X1, tail2: X2) => Y,
 *   pure1: X1,
 *   pure2: X2,
 * ) => import("./sequence").Sequence<never, Y>}
 */
export const liftSequence__ = (liftee, tail1, tail2) => ({
  head: [],
  tail: liftee(tail1, tail2),
});

/**
 * @type {<W1, W2, X1, X2, X3, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   pure3: X3,
 * ) => import("./sequence").Sequence<W1 | W2, Y>}
 */
export const liftSequenceXX_ = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  tail3,
) => ({
  head: [...head1, ...head2],
  tail: liftee(tail1, tail2, tail3),
});

/**
 * @type {<W2, X1, X2, X3, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   pure3: X3,
 * ) => import("./sequence").Sequence<W2, Y>}
 */
export const liftSequence_X_ = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  tail3,
) => ({
  head: head2,
  tail: liftee(tail1, tail2, tail3),
});

/**
 * @type {<W1, W2, W3, X1, X2, X3, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3, Y>}
 */
export const liftSequenceXXX = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
) => ({
  head: [...head1, ...head2, ...head3],
  tail: liftee(tail1, tail2, tail3),
});

/**
 * @type {<W1, X1, X2, X3, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 * ) => import("./sequence").Sequence<W1, Y>}
 */
export const liftSequenceX__ = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  tail3,
) => ({
  head: head1,
  tail: liftee(tail1, tail2, tail3),
});

/**
 * @type {<W1, W2, W3, W4, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3 | W4, Y>}
 */
export const liftSequenceXXXX = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
) => ({
  head: [...head1, ...head2, ...head3, ...head4],
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W1, Y>}
 */
export const liftSequenceX___ = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  tail3,
  tail4,
) => ({
  head: head1,
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, W2, W3, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W1 | W2 | W3, Y>}
 */
export const liftSequenceXXX_ = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  tail4,
) => ({
  head: [...head1, ...head2, ...head3],
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W2, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   pure3: X3,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W2, Y>}
 */
export const liftSequence_X__ = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  tail3,
  tail4,
) => ({
  head: head2,
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W3, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W3, Y>}
 */
export const liftSequence__X_ = (
  liftee,
  tail1,
  tail2,
  { head: head3, tail: tail3 },
  tail4,
) => ({
  head: head3,
  tail: liftee(tail1, tail2, tail3, tail4),
});

//////////
// Call //
//////////

/**
 * @type {<W1, X1, W2, Y>(
 *   callee: (
 *     tail1: X1,
 *   ) => import("./sequence").Sequence<W2, Y>,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 * ) => import("./sequence").Sequence<W1 | W2, Y>}
 */
export const callSequenceX = (callee, { head: head1, tail: tail1 }) => {
  const { head, tail } = callee(tail1);
  return { head: [...head1, ...head], tail };
};

/**
 * @type {<W1, X1, W2, X2, W3, Y>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *   ) => import("./sequence").Sequence<W3, Y>,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3, Y>}
 */
export const callSequenceXX = (
  callee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
) => {
  const { head, tail } = callee(tail1, tail2);
  return { head: [...head1, ...head2, ...head], tail };
};

/**
 * @type {<W1, X1, W2, X2, W3, X3, W4, Y>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence").Sequence<W4, Y>,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3 | W4, Y>}
 */
export const callSequenceXXX = (
  callee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
) => {
  const { head, tail } = callee(tail1, tail2, tail3);
  return { head: [...head1, ...head2, ...head3, ...head], tail };
};
