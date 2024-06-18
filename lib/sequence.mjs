// For haskell programmers out there: this is the writer monad on lists.

import {
  EMPTY,
  compileGet,
  concatXX,
  concatXXX,
  concatXXXX,
  concatXXXXX,
  concat_X,
  filterNarrow,
  flatMap,
  map,
} from "./util/index.mjs";

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
 *   head: W1,
 *   sequence: import("./sequence").Sequence<W2, X>,
 * ) => import("./sequence").Sequence<W1 | W2, X>}
 */
export const logSequence = (item, { head, tail }) => ({
  head: concat_X(item, head),
  tail,
});

/**
 * @type {<W1, W2, X>(
 *   head: W1[],
 *   sequence: import("./sequence").Sequence<W2, X>,
 * ) => import("./sequence").Sequence<W1 | W2, X>}
 */
export const prependSequence = (head1, { head: head2, tail }) => ({
  head: concatXX(head1, head2),
  tail,
});

/**
 * @type {<W1, W2, X>(
 *   head: W1[],
 *   sequence: import("./sequence").Sequence<W2, X>,
 * ) => import("./sequence").Sequence<W1 | W2, X>}
 */
export const appendSequence = (head2, { head: head1, tail }) => ({
  head: concatXX(head1, head2),
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
 * @type {<W1, X1, W2, X2, Y>(
 *   mappee1: import("./sequence").Sequence<W1, X1>,
 *   mappee2: import("./sequence").Sequence<W2, X2>,
 *   update: (tail1: X1, tail2: X2) => Y,
 * ) => import("./sequence").Sequence<W1 | W2, Y>}
 */
export const mapTwoSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  update,
) => ({
  head: concatXX(head1, head2),
  tail: update(tail1, tail2),
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
  return { head: concatXX(head1, head), tail };
};

/**
 * @type {<W1, X1, W2, X2, W, Y>(
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   kontinue: (
 *     tail1: X1,
 *     tail2: X2,
 *   ) => import("./sequence").Sequence<W, Y>,
 * ) => import("./sequence").Sequence<W1 | W2 | W, Y>}
 */
export const bindTwoSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  kontinue,
) => {
  const { head, tail } = kontinue(tail1, tail2);
  return { head: concatXXX(head1, head2, head), tail };
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
  head: concatXX(head1, head2),
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
 * @type {<X1, W2, X2, X3, W4, X4, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *   ) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   pure3: X3,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 * ) => import("./sequence").Sequence<W2 | W4, Y>}
 */
export const liftSequence_X_X = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  tail3,
  { head: head4, tail: tail4 },
) => ({
  head: concatXX(head2, head4),
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, X1, X2, W3, X3, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => Y,
 *   sequence2: import("./sequence").Sequence<W1, X1>,
 *   pure3: X2,
 *   sequence4: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W1 | W3, Y>}
 */
export const liftSequenceX_X = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  { head: head3, tail: tail3 },
) => ({
  head: concatXX(head1, head3),
  tail: liftee(tail1, tail2, tail3),
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
  head: concatXX(head1, head2),
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
  head: concatXX(head1, head2),
  tail: liftee(tail1, tail2, tail3),
});

/**
 * @type {<X1, X2, X3, W3, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence2: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W3, Y>}
 */
export const liftSequence__X = (
  liftee,
  tail1,
  tail2,
  { head: head3, tail: tail3 },
) => ({
  head: head3,
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
  head: concatXXX(head1, head2, head3),
  tail: liftee(tail1, tail2, tail3),
});

/**
 * @type {<W2, W3, X1, X2, X3, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W2 | W3, Y>}
 */
export const liftSequence_XX = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
) => ({
  head: concatXX(head2, head3),
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
  head: concatXXXX(head1, head2, head3, head4),
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W2, W3, W4, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 * ) => import("./sequence").Sequence<W2 | W3 | W4, Y>}
 */
export const liftSequence_XXX = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
) => ({
  head: concatXXX(head2, head3, head4),
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, W2, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   pure3: X3,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W1 | W2, Y>}
 */
export const liftSequenceXX__ = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  tail3,
  tail4,
) => ({
  head: concatXX(head1, head2),
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, W3, X1, X2, X3, X4, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W1 | W3, Y>}
 */
export const liftSequenceX_X_ = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  { head: head3, tail: tail3 },
  tail4,
) => ({
  head: concatXX(head1, head3),
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
  head: concatXXX(head1, head2, head3),
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
 * @type {<W4, X1, X2, X3, X4, X5, Y>(
 *   liftee: (tail1: X1, tail2: X2, tail3: X3, tail4: X4, tail5: X5) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence2: import("./sequence").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence").Sequence<W4, Y>}
 */
export const liftSequence___X_ = (
  liftee,
  tail1,
  tail2,
  tail3,
  { head: head4, tail: tail4 },
  tail5,
) => ({
  head: head4,
  tail: liftee(tail1, tail2, tail3, tail4, tail5),
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

/**
 * @type {<X1, X2, W3, X3, W4, X4, X5, X6, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *     tail6: X6,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 *   pure5: X5,
 *   pure6: X6,
 * ) => import("./sequence").Sequence<W3 | W4, Y>}
 */
export const liftSequence__XX__ = (
  liftee,
  tail1,
  tail2,
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
  tail5,
  tail6,
) => ({
  head: concatXX(head3, head4),
  tail: liftee(tail1, tail2, tail3, tail4, tail5, tail6),
});

/**
 * @type {<X1, X2, X3, W4, X4, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 * ) => import("./sequence").Sequence<W4, Y>}
 */
export const liftSequence___X = (
  liftee,
  tail1,
  tail2,
  tail3,
  { head: head4, tail: tail4 },
) => ({
  head: head4,
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<X1, X2, X3, W4, X4, X5, X6, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *     tail6: X6,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence3: import("./sequence").Sequence<W4, X4>,
 *   pure5: X5,
 *   pure6: X6,
 * ) => import("./sequence").Sequence<W4, Y>}
 */
export const liftSequence___X__ = (
  liftee,
  tail1,
  tail2,
  tail3,
  { head: head4, tail: tail4 },
  tail5,
  tail6,
) => ({
  head: head4,
  tail: liftee(tail1, tail2, tail3, tail4, tail5, tail6),
});

/**
 * @type {<W1, X1, X2, X3, X4, W5, X5, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *   ) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 *   sequence5: import("./sequence").Sequence<W5, X5>,
 * ) => import("./sequence").Sequence<W1 | W5, Y>}
 */
export const liftSequenceX___X = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  tail3,
  tail4,
  { head: head5, tail: tail5 },
) => ({
  head: concatXX(head1, head5),
  tail: liftee(tail1, tail2, tail3, tail4, tail5),
});

/**
 * @type {<W1, W3, W4, X1, X2, X3, X4, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *   ) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 * ) => import("./sequence").Sequence<W1 | W3 | W4, Y>}
 */
export const liftSequenceX_XX = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
) => ({
  head: concatXXX(head1, head3, head4),
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<W1, X1, X2, W3, X3, X4, X5, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *   ) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 *   pure5: X5,
 * ) => import("./sequence").Sequence<W1 | W3, Y>}
 */
export const liftSequenceX_X__ = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  { head: head3, tail: tail3 },
  tail4,
  tail5,
) => ({
  head: concatXX(head1, head3),
  tail: liftee(tail1, tail2, tail3, tail4, tail5),
});

/**
 * @type {<X1, W2, X2, W3, X3, X4, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *   ) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W2 | W3, Y>}
 */
export const liftSequence_XX_ = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  tail4,
) => ({
  head: concatXX(head2, head3),
  tail: liftee(tail1, tail2, tail3, tail4),
});

/**
 * @type {<X1, X2, X3, X4, W5, X5, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 *   sequence5: import("./sequence").Sequence<W5, X5>,
 * ) => import("./sequence").Sequence<W5, Y>}
 */
export const liftSequence____X = (
  liftee,
  tail1,
  tail2,
  tail3,
  tail4,
  { head: head5, tail: tail5 },
) => ({
  head: head5,
  tail: liftee(tail1, tail2, tail3, tail4, tail5),
});

/**
 * @type {<X1, W2, X2, W3, X3, W4, X4, X5, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *   ) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence").Sequence<W2 | W3 | W4, Y>}
 */
export const liftSequence_XXX_ = (
  liftee,
  tail1,
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
  tail5,
) => ({
  head: concatXXX(head2, head3, head4),
  tail: liftee(tail1, tail2, tail3, tail4, tail5),
});

/**
 * @type {<W1, X1, W2, X2, W3, X3, W4, X4, W5, X5, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *   ) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 *   sequence5: import("./sequence").Sequence<W5, X5>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3 | W4 | W5, Y>}
 */
export const liftSequenceXXXXX = (
  liftee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
  { head: head4, tail: tail4 },
  { head: head5, tail: tail5 },
) => ({
  head: concatXXXXX(head1, head2, head3, head4, head5),
  tail: liftee(tail1, tail2, tail3, tail4, tail5),
});

/**
 * @type {<W1, X1, X2, W3, X3, W4, X4, X5, X6, W7, X7, Y>(
 *   liftee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *     tail6: X6,
 *     tail7: X7,
 *   ) => Y,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 *   pure5: X5,
 *   pure6: X6,
 *   sequence7: import("./sequence").Sequence<W7, X7>,
 * ) => import("./sequence").Sequence<W1 | W3 | W7, Y>}
 */
export const liftSequenceX_X___X = (
  liftee,
  { head: head1, tail: tail1 },
  tail2,
  { head: head3, tail: tail3 },
  tail4,
  tail5,
  tail6,
  { head: head7, tail: tail7 },
) => ({
  head: concatXXX(head1, head3, head7),
  tail: liftee(tail1, tail2, tail3, tail4, tail5, tail6, tail7),
});

//////////
// Call //
//////////

/**
 * @type {<W1, X1, W, X>(
 *   callee: (
 *     tail1: X1,
 *   ) => import("./sequence").Sequence<W, X>,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 * ) => import("./sequence").Sequence<W | W1, X>}
 */
export const callSequenceX = (callee, { head: head1, tail: tail1 }) => {
  const { head, tail } = callee(tail1);
  return { head: concatXX(head1, head), tail };
};

/**
 * @type {<X1, X2, X3, W4, X4, X5, W, X>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *     tail5: X5,
 *   ) => import("./sequence").Sequence<W, X>,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence").Sequence<W4 | W, X>}
 */
export const callSequence___X_ = (
  callee,
  tail1,
  tail2,
  tail3,
  { head: head4, tail: tail4 },
  tail5,
) => {
  const { head, tail } = callee(tail1, tail2, tail3, tail4, tail5);
  return { head: concatXX(head4, head), tail };
};

/**
 * @type {<W1, X1, W2, X2, W, X>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *   ) => import("./sequence").Sequence<W, X>,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 * ) => import("./sequence").Sequence<W1 | W2 | W, X>}
 */
export const callSequenceXX = (
  callee,
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
) => {
  const { head, tail } = callee(tail1, tail2);
  return { head: concatXXX(head1, head2, head), tail };
};

/**
 * @type {<X1, W2, X2, W, X>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *   ) => import("./sequence").Sequence<W, X>,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 * ) => import("./sequence").Sequence<W2 | W, X>}
 */
export const callSequence_X = (callee, tail1, { head: head2, tail: tail2 }) => {
  const { head, tail } = callee(tail1, tail2);
  return { head: concatXX(head2, head), tail };
};

/**
 * @type {<X1, W2, X2, X3, W, X>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence").Sequence<W, X>,
 *   pure1: X1,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   pure3: X3,
 * ) => import("./sequence").Sequence<W | W2, X>}
 */
export const callSequence_X_ = (
  callee,
  tail1,
  { head: head2, tail: tail2 },
  tail3,
) => {
  const { head, tail } = callee(tail1, tail2, tail3);
  return { head: concatXX(head2, head), tail };
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
  return { head: concatXXXX(head1, head2, head3, head), tail };
};

/**
 * @type {<X1, X2, W3, X3, W4, Y>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence").Sequence<W4, Y>,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W3 | W4, Y>}
 */
export const callSequence__X = (
  callee,
  tail1,
  tail2,
  { head: head3, tail: tail3 },
) => {
  const { head, tail } = callee(tail1, tail2, tail3);
  return { head: concatXX(head3, head), tail };
};

/**
 * @type {<X1, X2, W3, X3, X4, W, Y>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *   ) => import("./sequence").Sequence<W, Y>,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence").Sequence<W3 | W, Y>}
 *
 */
export const callSequence__X_ = (
  callee,
  tail1,
  tail2,
  { head: head3, tail: tail3 },
  tail4,
) => {
  const { head, tail } = callee(tail1, tail2, tail3, tail4);
  return { head: concatXX(head3, head), tail };
};

/**
 * @type {<X1, X2, X3, W4, X4, W, Y>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *     tail4: X4,
 *   ) => import("./sequence").Sequence<W, Y>,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence").Sequence<W4, X4>,
 * ) => import("./sequence").Sequence<W4 | W, Y>}
 */
export const callSequence___X = (
  callee,
  tail1,
  tail2,
  tail3,
  { head: head4, tail: tail4 },
) => {
  const { head, tail } = callee(tail1, tail2, tail3, tail4);
  return { head: concatXX(head4, head), tail };
};

/**
 * @type {<W1, X1, X2, X3, W, Y>(
 *   callee: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence").Sequence<W, Y>,
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 * ) => import("./sequence").Sequence<W1 | W, Y>}
 */
export const callSequenceX__ = (
  callee,
  { head: head1, tail: tail1 },
  tail2,
  tail3,
) => {
  const { head, tail } = callee(tail1, tail2, tail3);
  return { head: concatXX(head1, head), tail };
};
