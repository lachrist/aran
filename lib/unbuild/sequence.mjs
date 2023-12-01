// For haskell programmers out there: this is the writer monad on lists.

import { escapePseudoBlock } from "../escape.mjs";
import {
  compileGet,
  filterNarrow,
  flatMap,
  map,
  reduce,
} from "../util/index.mjs";
import { collectBoundVariable } from "./collect.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import {
  makeBlockStatement,
  makeClosureBlock,
  makeControlBlock,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makePseudoBlock,
  makeSequenceExpression,
  report,
} from "./node.mjs";

/**
 * @template W
 * @template X
 * @typedef {import("./sequence.js").Sequence<W, X>} Sequence
 */

/**
 * @typedef {import("../../type/options.js").Base} Base
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

/////////////
// Generic //
/////////////

/** @type {<W, X>(head: W[], tail: X) => Sequence<W, X>} */
export const initSequence = (head, tail) => ({
  head,
  tail,
});

/** @type {<W>(tail: W[]) => Sequence<W, null>} */
export const tellSequence = (head) => ({ head, tail: null });

/** @type {<W, X>(tail: X) => Sequence<W, X>} */
export const zeroSequence = (tail) => ({ head: [], tail });

/** @type {<W, X>(sequence: Sequence<W, X>) => Sequence<W, null>} */
export const dropSequence = ({ head }) => ({ head, tail: null });

/**
 * @type {<W>(
 *   Sequence: Sequence<W, null>,
 * ) => W[]}
 */
export const listenSequence = ({ head }) => head;

/**
 * @type {<W, X1, X2>(
 *   Sequence: Sequence<W, X1>,
 *   update: (tail: X1) => X2,
 * ) => Sequence<W, X2>}
 */
export const mapSequence = ({ head, tail }, update) => ({
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
 *   sequence: EffectSequence<aran.Expression<unbuild.Atom>>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const sequenceExpression = ({ head, tail }, path) =>
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
const isBlockBody = (item) => typeof item !== "string";

/**
 * @type {(
 *   sequence: BlockSequence<aran.Expression<unbuild.Atom>>,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const sequenceClosureBlock = ({ head, tail }, path) => {
  const block_head_1 = filterNarrow(head, isBlockHead);
  const block_body = filterNarrow(head, isBlockBody);
  const block_head_2 = collectBoundVariable(block_body);
  return makeClosureBlock(
    [...block_head_2, ...block_head_1],
    block_body,
    tail,
    path,
  );
};

/**
 * @type {(
 *   sequence: BlockSequence<null>,
 *   labels: unbuild.Label[],
 *   path: unbuild.Path,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const sequenceControlBlock = ({ head }, labels, path) => {
  const block_head_1 = filterNarrow(head, isBlockHead);
  const block_body = filterNarrow(head, isBlockBody);
  const block_head_2 = collectBoundVariable(block_body);
  return makeControlBlock(
    labels,
    [...block_head_2, ...block_head_1],
    block_body,
    path,
  );
};

/**
 * @type {(
 *   sequence: BlockSequence<null>,
 *   labels: unbuild.Label[],
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const sequenceControlStatement = ({ head }, labels, path) => {
  const block_head_1 = filterNarrow(head, isBlockHead);
  const block_body = filterNarrow(head, isBlockBody);
  const block_head_2 = collectBoundVariable(block_body);
  const block_head = [...block_head_2, ...block_head_1];
  if (labels.length === 0 && block_head.length === 0) {
    return block_body;
  } else {
    return [
      makeBlockStatement(
        makeControlBlock(
          labels,
          [...block_head_2, ...block_head_1],
          block_body,
          path,
        ),
        path,
      ),
    ];
  }
};

/**
 * @type {(
 *   sequence: BlockSequence<aran.Expression<unbuild.Atom>>,
 *   base: Base,
 *   path: unbuild.Path,
 * ) => aran.PseudoBlock<unbuild.Atom>}
 */
export const sequencePseudoBlock = ({ head, tail }, base, path) => {
  const block_head_1 = filterNarrow(head, isBlockHead);
  const block_body = filterNarrow(head, isBlockBody);
  const block_head_2 = collectBoundVariable(block_body);
  return escapePseudoBlock(
    makePseudoBlock(block_body, tail, path),
    [...block_head_2, ...block_head_1],
    {
      makeReadExpression: (variable, { logs, path }) =>
        reduce(
          logs,
          report,
          makeGetExpression(
            makeIntrinsicExpression("aran.cache", path),
            makePrimitiveExpression(`${base}.${variable}`, path),
            path,
          ),
        ),
      makeWriteEffect: (variable, right, { logs, path }) =>
        reduce(
          logs,
          report,
          makeExpressionEffect(
            makeSetExpression(
              "strict",
              makeIntrinsicExpression("aran.cache", path),
              makePrimitiveExpression(`${base}.${variable}`, path),
              right,
              path,
            ),
            path,
          ),
        ),
    },
  );
};
