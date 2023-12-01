// For haskell programmers out there: this is the writer monad on lists.

import { compileGet, filterNarrow, flatMap, map } from "../util/index.mjs";
import { collectBoundMetaVariable } from "./collect.mjs";
import {
  makeClosureBlock,
  makeControlBlock,
  makeSequenceExpression,
} from "./node.mjs";

/**
 * @template W
 * @template X
 * @typedef {import("./sequence.js").Sequence<W, X>} Sequence
 */

/**
 * @template X
 * @typedef {import("./sequence.js").EffectSequence<X>} EffectSequence
 */

/**
 * @template X
 * @typedef {import("./sequence.js").StatementSequence<X>} StatementSequence
 */

/**
 * @template X
 * @typedef {import("./sequence.js").BlockSequence<X>} BlockSequence
 */

const getHead = compileGet("head");

const getTail = compileGet("tail");

/** @type {<W, X>(head: W[], tail: X) => Sequence<W, X>} */
export const initSequence = (head, tail) => ({
  head,
  tail,
});

/** @type {<W>(tail: W[]) => Sequence<W, null>} */
export const tellSequence = (head) => ({ head, tail: null });

/** @type {<W, X>(tail: X) => Sequence<W, X>} */
export const zeroSequence = (tail) => ({ head: [], tail });

/**
 * @type {<W, X1, X2>(
 *   Sequence: Sequence<W, X1>,
 *   update: (tail: X1) => X2,
 * ) => Sequence<W, X2>}
 */
export const liftSequence = ({ head, tail }, update) => ({
  head,
  tail: update(tail),
});

/**
 * @type {<W1, W2, X>(
 *   Sequence: Sequence<W1, X>,
 *   update: (head: W1) => W2,
 * ) => Sequence<W2, X>}
 */
export const passSequence = ({ head, tail }, update) => ({
  head: map(head, update),
  tail,
});

/**
 * @type {<W, X1, X2>(
 *   Sequence: Sequence<W, X1>,
 *   kontinue: (tail: X1) => Sequence<W, X2>,
 * ) => Sequence<W, X2>}
 */
export const bindSequence = ({ head: head1, tail: tail1 }, kontinue) => {
  const { head: head2, tail: tail2 } = kontinue(tail1);
  return { head: [...head1, ...head2], tail: tail2 };
};

/**
 * @type {<W, X1, X2>(
 *  Sequence1: Sequence<W, X1>,
 *  Sequence2: Sequence<W, X2>,
 * ) => Sequence<W, X2>}
 */
export const nextSequence = (
  { head: head1 },
  { head: head2, tail: tail2 },
) => ({
  head: [...head1, ...head2],
  tail: tail2,
});

/**
 * @type {<W, X>(
 *   Sequence: Sequence<W, X>[],
 * ) => Sequence<W, X[]>}
 */
export const flatSequence = (Sequences) => ({
  head: flatMap(Sequences, getHead),
  tail: map(Sequences, getTail),
});

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   sequence: EffectSequence<aran.Expression<unbuild.Atom>>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unwrapSequenceExpression = ({ path }, { head, tail }) =>
  makeSequenceExpression(head, tail, path);

/**
 * @type {(
 *   item: unbuild.Variable | aran.Statement<unbuild.Atom>,
 * ) => item is unbuild.Variable}
 */
const isBlockHead = (item) => typeof item === "string";

/**
 * @type {(
 *   item: unbuild.Variable | aran.Statement<unbuild.Atom>,
 * ) => item is aran.Statement<unbuild.Atom>}
 */
const isBlockTail = (item) => typeof item !== "string";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   sequence: BlockSequence<aran.Expression<unbuild.Atom>>,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const unwrapSequenceClosureBlock = ({ path }, { head, tail }) => {
  const body_head = filterNarrow(head, isBlockHead);
  const body_tail = filterNarrow(head, isBlockTail);
  return makeClosureBlock(
    [...collectBoundMetaVariable(body_tail), ...body_head],
    body_tail,
    tail,
    path,
  );
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   sequence: StatementSequence<null>,
 *   options: {
 *     variables: unbuild.Variable[],
 *     labels: unbuild.Label[],
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unwrapSequenceControlBlock = ({ path }, { head }, { labels }) =>
  makeControlBlock(
    labels,
    filterNarrow(head, isBlockHead),
    filterNarrow(head, isBlockTail),
    path,
  );
