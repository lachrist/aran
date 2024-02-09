// For haskell programmers out there: this is the writer monad on lists.

import { AranTypeError } from "../error.mjs";
import {
  compileGet,
  filterNarrow,
  flatMap,
  map,
  reduceReverse,
} from "../util/index.mjs";
import {
  isNotPrefixConditionPrelude,
  isNotPrefixPrelude,
  isPrefixConditionPrelude,
  isPrefixPrelude,
} from "./prelude.mjs";

const getData = compileGet("data");

const getHead = compileGet("head");

const getTail = compileGet("tail");

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
 * @type {<W>(
 *   tail: W[],
 * ) => import("./sequence").Sequence<W, null>}
 */
export const tellSequence = (head) => ({ head, tail: null });

/**
 * @type {<W, X>(
 *   tail: X,
 * ) => import("./sequence").Sequence<W, X>}
 */
export const zeroSequence = (tail) => ({ head: [], tail });

/**
 * @type {<W, X>(
 *   sequence: import("./sequence").Sequence<W, X>,
 * ) => import("./sequence").Sequence<W, null>}
 */
export const dropSequence = ({ head }) => ({ head, tail: null });

/**
 * @type {<W>(
 *   sequence: import("./sequence").Sequence<W, null>,
 * ) => W[]}
 */
export const listenSequence = ({ head }) => head;

/**
 * @type {<W, X, Y>(
 *   sequence: import("./sequence").Sequence<W, X>,
 *   update: (tail: X) => Y,
 * ) => import("./sequence").Sequence<W, Y>}
 */
export const mapSequence = ({ head, tail }, update) => ({
  head,
  tail: update(tail),
});

/**
 * @type {<W, X1, X2, Y>(
 *   sequence1: import("./sequence").Sequence<W, X1>,
 *   sequence2: import("./sequence").Sequence<W, X2>,
 *   combine: (tail1: X1, tail2: X2) => Y,
 * ) => import("./sequence").Sequence<W, Y>}
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
 *   sequence1: import("./sequence").Sequence<W, X1>,
 *   sequence2: import("./sequence").Sequence<W, X2>,
 *   sequence3: import("./sequence").Sequence<W, X3>,
 *   combine: (tail1: X1, tail2: X2, tail3: X3) => Y,
 * ) => import("./sequence").Sequence<W, Y>}
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
 *   sequence1: import("./sequence").Sequence<W, X1>,
 *   sequence2: import("./sequence").Sequence<W, X2>,
 *   sequence3: import("./sequence").Sequence<W, X3>,
 *   sequence4: import("./sequence").Sequence<W, X4>,
 *   combine: (tail1: X1, tail2: X2, tail3: X3, tail4: X4) => Y,
 * ) => import("./sequence").Sequence<W, Y>}
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
 * @type {<W1, X1, W2, X2, W3, Y>(
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   kontinue: (
 *     tail1: X1,
 *     tail2: X2,
 *   ) => import("./sequence").Sequence<W3, Y>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3, Y>}
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
 * @type {<W1, X1, W2, X2, W3, X3, W4, Y>(
 *   sequence1: import("./sequence").Sequence<W1, X1>,
 *   sequence2: import("./sequence").Sequence<W2, X2>,
 *   sequence3: import("./sequence").Sequence<W3, X3>,
 *   kontinue: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence").Sequence<W4, Y>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3 | W4, Y>}
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
 * @type {<W1, W2, X1, X2>(
 *  Sequence1: import("./sequence").Sequence<W1, X1>,
 *  Sequence2: import("./sequence").Sequence<W2, X2>,
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
 * @type {<W1, X1, W2, X2, W3, X3>(
 *  sequence1: import("./sequence").Sequence<W1, X1>,
 *  sequence2: import("./sequence").Sequence<W2, X2>,
 *  sequence3: import("./sequence").Sequence<W3, X3>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3, X3>}
 */
export const thenTwoSequence = (
  { head: head1 },
  { head: head2 },
  { head: head3, tail: tail3 },
) => ({
  head: [...head1, ...head2, ...head3],
  tail: tail3,
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

//////////////
// Specific //
//////////////

/**
 * @type {(
 *   inner: aran.Effect<unbuild.Atom>,
 * ) => aran.Statement<unbuild.Atom>}
 */
const initEffectStatement = (inner) => ({
  type: "EffectStatement",
  inner,
  tag: inner.tag,
});

/**
 * @type {(
 *   head: aran.Effect<unbuild.Atom>[],
 *   tail: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const initSequenceExpression = (head, tail) =>
  head.length === 0
    ? tail
    : {
        type: "SequenceExpression",
        head,
        tail,
        tag: tail.tag,
      };

/**
 * @type {(
 *   sequence: import("./sequence").Sequence<
 *     import("./prelude").CachePrelude,
 *     aran.Statement<unbuild.Atom>[],
 *   >,
 * ) => import("./sequence").StatementSequence}
 */
export const prefixStatement = ({ head, tail }) => ({
  head: filterNarrow(head, isNotPrefixPrelude),
  tail: [
    ...map(
      map(filterNarrow(head, isPrefixPrelude), getData),
      initEffectStatement,
    ),
    ...tail,
  ],
});

/**
 * @type {(
 *   sequence: import("./sequence").Sequence<
 *     import("./prelude").CachePrelude,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 * ) => import("./sequence").EffectSequence}
 */
export const prefixEffect = ({ head, tail }) => ({
  head: filterNarrow(head, isNotPrefixPrelude),
  tail: [...map(filterNarrow(head, isPrefixPrelude), getData), ...tail],
});

/**
 * @type {(
 *   sequence: import("./sequence").Sequence<
 *     import("./prelude").CachePrelude,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").ExpressionSequence},
 */
export const prefixExpression = ({ head, tail }) => ({
  head: filterNarrow(head, isNotPrefixPrelude),
  tail: initSequenceExpression(
    map(filterNarrow(head, isPrefixPrelude), getData),
    tail,
  ),
});

/**
 * @type {(
 *   sequence: import("./sequence").Sequence<
 *     import("./prelude").FramePrelude,
 *     import("./body").ControlBody<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").ControlBodySequence}
 */
export const prefixControlBody = ({ head, tail }) => ({
  head: filterNarrow(head, isNotPrefixPrelude),
  tail: {
    content: [
      ...map(
        map(filterNarrow(head, isPrefixPrelude), getData),
        initEffectStatement,
      ),
      ...tail.content,
    ],
  },
});

/**
 * @type {(
 *   sequence: import("./sequence").Sequence<
 *     import("./prelude").FramePrelude,
 *     import("./body").ClosureBody<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").ClosureBodySequence}
 */
export const prefixClosureBody = ({ head, tail }) => ({
  head: filterNarrow(head, isNotPrefixPrelude),
  tail: {
    content: [
      ...map(
        map(filterNarrow(head, isPrefixPrelude), getData),
        initEffectStatement,
      ),
      ...tail.content,
    ],
    completion: tail.completion,
  },
});

/**
 * @type {(
 *   sequence: import("./sequence").Sequence<
 *     import("./prelude").ChainPrelude,
 *     aran.Expression<unbuild.Atom>
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence
 * }
 */
export const chainExpression = ({ head, tail }) =>
  initSequence(
    filterNarrow(head, isNotPrefixConditionPrelude),
    reduceReverse(
      filterNarrow(head, isPrefixConditionPrelude),
      (node, prelude) => {
        if (prelude.type === "condition") {
          return /** @type {aran.Expression<unbuild.Atom>} */ ({
            type: "ConditionalExpression",
            condition: prelude.data.test,
            consequent: prelude.data.exit,
            alternate: node,
            tag: node.tag,
          });
        } else if (prelude.type === "prefix") {
          return /** @type {aran.Expression<unbuild.Atom>} */ ({
            type: "SequenceExpression",
            head: [prelude.data],
            tail: node,
            tag: node.tag,
          });
        } else {
          throw new AranTypeError(prelude);
        }
      },
      tail,
    ),
  );
