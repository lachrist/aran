// For haskell programmers out there: this is the writer monad on lists.

import { AranTypeError } from "../error.mjs";
import { escapePseudoBlock } from "../escape.mjs";
import {
  compileGet,
  filterNarrow,
  flatMap,
  map,
  reduce,
  reduceReverse,
} from "../util/index.mjs";
import { collectBoundVariable } from "./collect.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import {
  makeBlockStatement,
  makeClosureBlock,
  makeConditionalExpression,
  makeControlBlock,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makePseudoBlock,
  makeSequenceExpression,
  report,
} from "./node.mjs";

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
 *   Sequence: import("./sequence.d.ts").Sequence<W, null>,
 * ) => W[]}
 */
export const listenSequence = ({ head }) => head;

/**
 * @type {<W, X1, X2>(
 *   Sequence: import("./sequence.d.ts").Sequence<W, X1>,
 *   update: (tail: X1) => X2,
 * ) => import("./sequence.d.ts").Sequence<W, X2>}
 */
export const mapSequence = ({ head, tail }, update) => ({
  head,
  tail: update(tail),
});

/**
 * @type {<W1, W2, X>(
 *   Sequence: import("./sequence.d.ts").Sequence<W1, X>,
 *   update: (head: W1) => W2,
 * ) => import("./sequence.d.ts").Sequence<W2, X>}
 */
export const passSequence = ({ head, tail }, update) => ({
  head: map(head, update),
  tail,
});

/**
 * @type {<W, X1, X2>(
 *   Sequence: import("./sequence.d.ts").Sequence<W, X1>,
 *   kontinue: (
 *     tail: X1,
 *   ) => import("./sequence.d.ts").Sequence<W, X2>,
 * ) => import("./sequence.d.ts").Sequence<W, X2>}
 */
export const bindSequence = ({ head: head1, tail: tail1 }, kontinue) => {
  const { head: head2, tail: tail2 } = kontinue(tail1);
  return { head: [...head1, ...head2], tail: tail2 };
};

/**
 * @type {<W, X1, X2>(
 *  Sequence1: import("./sequence.d.ts").Sequence<W, X1>,
 *  Sequence2: import("./sequence.d.ts").Sequence<W, X2>,
 * ) => import("./sequence.d.ts").Sequence<W, X2>}
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
 *   sequence: import("./sequence.d.ts").BlockSequence<
 *     aran.Expression<unbuild.Atom>
 *   >,
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
 *   sequence: import("./sequence.d.ts").BlockSequence<null>,
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
 *   sequence: import("./sequence.d.ts").BlockSequence<null>,
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
 *   sequence: import("./sequence.d.ts").BlockSequence<
 *     aran.Expression<unbuild.Atom>
 *   >,
 *   base: import("../../type/options.d.ts").Base,
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
