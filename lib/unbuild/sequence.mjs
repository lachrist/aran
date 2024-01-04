// For haskell programmers out there: this is the writer monad on lists.

import { AranTypeError } from "../error.mjs";
import {
  compileGet,
  filterNarrow,
  flatMap,
  map,
  reduce,
  some,
} from "../util/index.mjs";
import { makeBlockStatement, makeControlBlock } from "./node.mjs";

import {
  isBaseDeclarationPrelude,
  isChainPrelude,
  isEffectPrelude,
  isNodePrelude,
} from "./prelude.mjs";

const getHead = compileGet("head");

const getTail = compileGet("tail");

const getData = compileGet("data");

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
 * @type {<W, X1, X2, X3, Y>(
 *   sequence1: import("./sequence").Sequence<W, X1>,
 *   sequence2: import("./sequence").Sequence<W, X2>,
 *   sequence3: import("./sequence").Sequence<W, X3>,
 *   kontinue: (
 *     tail1: X1,
 *     tail2: X2,
 *     tail3: X3,
 *   ) => import("./sequence").Sequence<W, Y>,
 * ) => import("./sequence").Sequence<W, Y>}
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
 * @type {<W, X>(
 *   sequences: import("./sequence").Sequence<W, X>[],
 * ) => import("./sequence").Sequence<W, X[]>}
 */
export const flatSequence = (sequences) => ({
  head: flatMap(sequences, getHead),
  tail: map(sequences, getTail),
});

/**
 * @type {<W1, X1, W2, X2>(
 *   sequence1: import("./sequence").Sequence<W1, X1[]>,
 *   sequence2: import("./sequence").Sequence<W2, X2[]>,
 * ) => import("./sequence").Sequence<W1 | W2, (X1 | X2)[]>}
 */
export const concatTwoSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
) => ({
  head: [...head1, ...head2],
  tail: [...tail1, ...tail2],
});

/**
 * @type {<W1, X1, W2, X2, W3, X3>(
 *   sequence1: import("./sequence").Sequence<W1, X1[]>,
 *   sequence2: import("./sequence").Sequence<W2, X2[]>,
 *   sequence3: import("./sequence").Sequence<W3, X3[]>,
 * ) => import("./sequence").Sequence<W1 | W2 | W3, (X1 | X2 | X3)[]>}
 */
export const concatThreeSequence = (
  { head: head1, tail: tail1 },
  { head: head2, tail: tail2 },
  { head: head3, tail: tail3 },
) => ({
  head: [...head1, ...head2, ...head3],
  tail: [...tail1, ...tail2, ...tail3],
});

/**
 * @type {<W, X>(
 *   sequence: import("./sequence").Sequence<W, X[]>[],
 * ) => import("./sequence").Sequence<W, X[]>}
 */
export const concatAllSequence = (sequences) => ({
  head: flatMap(sequences, getHead),
  tail: flatMap(sequences, getTail),
});

/**
 * @type {import("./sequence").Sequence<never, never[]>}
 */
export const EMPTY_SEQUENCE = {
  head: [],
  tail: [],
};

//////////////
// Specific //
//////////////

/**
 * @type {(
 *   sequence: import("./sequence").ChainSequence<(
 *     aran.Expression<unbuild.Atom>
 *   )>,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence
 * }
 */
export const sequenceChain = ({ head, tail }, path) =>
  initSequence(
    filterNarrow(head, isNodePrelude),
    reduce(
      filterNarrow(head, isChainPrelude),
      (node, prelude) => {
        if (prelude.type === "condition") {
          return /** @type {aran.Expression<unbuild.Atom>} */ ({
            type: "ConditionalExpression",
            condition: prelude.data.test,
            consequent: prelude.data.exit,
            alternate: node,
            tag: path,
          });
        } else if (prelude.type === "effect") {
          return /** @type {aran.Expression<unbuild.Atom>} */ ({
            type: "SequenceExpression",
            head: [prelude.data],
            tail: node,
          });
        } else {
          throw new AranTypeError(prelude);
        }
      },
      tail,
    ),
  );

/**
 * @type {(
 *   sequence: import("./sequence").SetupSequence<(
 *     aran.Expression<unbuild.Atom>
 *   )>,
 *   path: unbuild.Path,
 * ) => import("./sequence").ExpressionSequence}
 */
export const sequenceExpression = ({ head, tail }, path) =>
  initSequence(filterNarrow(head, isNodePrelude), {
    type: "SequenceExpression",
    head: map(filterNarrow(head, isEffectPrelude), getData),
    tail,
    tag: path,
  });

/**
 * @type {(
 *   sequence: import("./sequence").SetupSequence<(
 *     aran.Effect<unbuild.Atom>[]
 *   )>,
 *   path: unbuild.Path,
 * ) => import("./sequence").EffectSequence}
 */
export const sequenceEffect = ({ head, tail }, _path) =>
  initSequence(filterNarrow(head, isNodePrelude), [
    ...map(filterNarrow(head, isEffectPrelude), getData),
    ...tail,
  ]);

/**
 * @type {(
 *   labels: unbuild.Label[],
 *   sequence: import("./sequence").StatementSequence,
 *   path: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const sequenceControl = (labels, { head, tail }, path) => {
  if (labels.length > 0 || some(head, isBaseDeclarationPrelude)) {
    return makeBlockStatement(
      makeControlBlock(labels, { head, tail }, path),
      path,
    );
  } else {
    // This may seem unsafe because it moves meta variables in parent scope.
    // But control flow only occurs in proper block.
    // So this can only be used in naked block and hence it is safe.
    return { head, tail };
  }
};

/**
 * @type {(
 *   sequence: import("./sequence").SetupSequence<(
 *     aran.Statement<unbuild.Atom>[]
 *   )>,
 *   path: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const sequenceStatement = ({ head, tail }, path) =>
  initSequence(filterNarrow(head, isNodePrelude), [
    ...map(
      filterNarrow(head, isEffectPrelude),
      ({ data }) =>
        /** @type {aran.Statement<unbuild.Atom>} */ ({
          type: "EffectStatement",
          inner: data,
          tag: path,
        }),
    ),
    ...tail,
  ]);

/**
 * @type {(
 *   sequence: import("./sequence").SetupSequence<(
 *     import("./sequence").Completion
 *   )>,
 *   path: unbuild.Path,
 * ) => import("./sequence").CompletionSequence}
 */
export const sequenceCompletion = ({ head, tail }, path) =>
  initSequence(filterNarrow(head, isNodePrelude), {
    body: [
      ...map(
        filterNarrow(head, isEffectPrelude),
        ({ data }) =>
          /** @type {aran.Statement<unbuild.Atom>} */ ({
            type: "EffectStatement",
            inner: data,
            tag: path,
          }),
      ),
      ...tail.body,
    ],
    completion: tail.completion,
  });

// mapSequence(
//   flatSequence([
//     ...map(filterNarrow(head, isEffectPrelude), ({ data }) =>
//       makeEffectStatement(data, path),
//     ),
//     initSequence(filterNarrow(head, isNodePrelude), tail),
//   ]),
//   flat,
// );

//   /** @type {import("./prelude").Prelude[]} */
//   const preludes = [];
//   const nodes = [];
//   for (const prelude of head) {
//     if (prelude.type === "effect") {
//       nodes[nodes.length] = makeEffectStatement(prelude.data, path);
//     } else if (
//       prelude.type === "context" ||
//       prelude.type === "log" ||
//       prelude.type === "early-error" ||
//       prelude.type === "header" ||
//       prelude.type === "declaration"
//     ) {
//       preludes[preludes.length] = prelude;
//     } else {
//       throw new AranTypeError(prelude);
//     }
//   }
//   for (const node of tail) {
//     nodes[nodes.length] = node;
//   }
//   return { head: /** @type {any} */ (preludes), tail: nodes };
// };
// /* eslint-enable local/no-impure */

// /* eslint-disable local/no-impure */
// /**
//  * @type {<P extends import("./prelude").SetupPrelude>(
//  *   sequence: import("./sequence").Sequence<P, {
//  *     body: aran.Statement<unbuild.Atom>[],
//  *     completion: aran.Expression<unbuild.Atom>,
//  *   }>,
//  *   path: unbuild.Path,
//  * ) => import("./sequence").Sequence<
//  *   Exclude<P, (
//  *     | import("./prelude").DeclarationPrelude
//  *     | import("./prelude").EffectPrelude
//  *   )>,
//  *   aran.ClosureBlock<unbuild.Atom>
//  * >}
//  */
// export const sequenceClosureBlock = ({ head, tail }, path) => {
//   /** @type {import("./prelude").Prelude[]} */
//   const preludes = [];
//   /** @type {unbuild.Variable[]} */
//   const variables = [];
//   /** @type {aran.Statement<unbuild.Atom>[]} */
//   const nodes = [];
//   for (const prelude of head) {
//     if (prelude.type === "effect") {
//       nodes[nodes.length] = makeEffectStatement(prelude.data, path);
//     } else if (prelude.type === "declaration") {
//       variables[variables.length] = prelude.data;
//     } else if (
//       prelude.type === "context" ||
//       prelude.type === "early-error" ||
//       prelude.type === "header" ||
//       prelude.type === "log"
//     ) {
//       preludes[preludes.length] = prelude;
//     } else {
//       throw new AranTypeError(prelude);
//     }
//   }
//   for (const node of tail.body) {
//     nodes[nodes.length] = node;
//   }
//   return {
//     head: /** @type {any} */ (preludes),
//     tail: makeClosureBlock(variables, nodes, tail.completion, path),
//   };
// };
// /* eslint-enable local/no-impure */

// /* eslint-disable local/no-impure */
// /**
//  * @type {<P extends import("./prelude").SetupPrelude>(
//  *   sequence: import("./sequence").Sequence<P, {
//  *     body: aran.Statement<unbuild.Atom>[],
//  *   }>,
//  *   labels: unbuild.Label[],
//  *   path: unbuild.Path,
//  * ) => import("./sequence").Sequence<
//  *   Exclude<P, (
//  *     | import("./prelude").DeclarationPrelude
//  *     | import("./prelude").EffectPrelude
//  *   )>,
//  *   aran.ControlBlock<unbuild.Atom>,
//  * >}
//  */
// export const sequenceControlBlock = ({ head, tail }, labels, path) => {
//   /** @type {import("./prelude").Prelude[]} */
//   const preludes = [];
//   /** @type {unbuild.Variable[]} */
//   const variables = [];
//   /** @type {aran.Statement<unbuild.Atom>[]} */
//   const nodes = [];
//   for (const prelude of head) {
//     if (prelude.type === "effect") {
//       nodes[nodes.length] = makeEffectStatement(prelude.data, path);
//     } else if (prelude.type === "declaration") {
//       variables[variables.length] = prelude.data;
//     } else if (
//       prelude.type === "context" ||
//       prelude.type === "early-error" ||
//       prelude.type === "header" ||
//       prelude.type === "log"
//     ) {
//       preludes[preludes.length] = prelude;
//     } else {
//       throw new AranTypeError(prelude);
//     }
//   }
//   for (const node of tail.body) {
//     nodes[nodes.length] = node;
//   }
//   return {
//     head: /** @type {any} */ (preludes),
//     tail: makeControlBlock(labels, variables, nodes, path),
//   };
// };
// /* eslint-enable local/no-impure */

// /**
//  * @type {(prelude: import("./prelude").Prelude) => boolean}
//  */
// const isBaseDeclaration = (prelude) =>
//   prelude.type === "declaration" && isBaseVariable(prelude.data);

// /**
//  * @type {<P extends import("./prelude").SetupPrelude>(
//  *   sequence: import("./sequence").Sequence<P, {
//  *     body: aran.Statement<unbuild.Atom>[],
//  *   }>,
//  *   labels: unbuild.Label[],
//  *   path: unbuild.Path,
//  * ) => import("./sequence").Sequence<
//  *   Exclude<P, (
//  *     import("./prelude").EffectPrelude
//  *   )>,
//  *   aran.Statement<unbuild.Atom>[]
//  * >}
//  */
// export const sequenceControlStatement = ({ head, tail }, labels, path) => {
//   if (labels.length > 0 || some(head, isBaseDeclaration)) {
//     return mapSequence(
//       sequenceControlBlock({ head, tail }, labels, path),
//       (block) => [makeBlockStatement(block, path)],
//     );
//   } else {
//     // This may seem unsafe because it moves meta variables in parent scope.
//     // But control flow only occurs in proper block.
//     // So this can only be used in naked block and hence it is safe.
//     return sequenceStatement({ head, tail: tail.body }, path);
//   }
// };

// /* eslint-disable local/no-impure */
// /**
//  * @type {<P extends import("./prelude").BlockPrelude>(
//  *   sequence: import("./sequence").Sequence<P, (
//  *     import("../../type/aran").ClosureBlock<unbuild.Atom>
//  *   )>,
//  *   path: unbuild.Path,
//  * ) => import("./sequence").Sequence<
//  *   Exclude<P, (
//  *     | import("./prelude").HeaderPrelude
//  *     | import("./prelude").EarlyErrorPrelude
//  *   )>,
//  *   aran.Program<unbuild.Atom>
//  * >}
//  */
// export const sequenceProgram = ({ head, tail }, path) => {
//   /** @type {import("../header").Header[]} */
//   const headers = [];
//   /** @type {import("./early-error").EarlyError[]} */
//   const errors = [];
//   /** @type {import("./prelude").Prelude[]} */
//   const preludes = [];
//   for (const prelude of head) {
//     if (prelude.type === "header") {
//       headers[headers.length] = prelude.data;
//     } else if (prelude.type === "early-error") {
//       errors[errors.length] = prelude.data;
//     } else if (prelude.type === "context" || prelude.type === "log") {
//       preludes[preludes.length] = prelude;
//     } else {
//       throw new AranTypeError(prelude);
//     }
//   }
//   return {
//     head: /** @type {any} */ (preludes),
//     tail: makeProgram(
//       headers,
//       makeClosureBlock(
//         tail.variables,
//         [...map(errors, makeEarlyErrorStatement), ...tail.statements],
//         tail.completion,
//         tail.tag,
//       ),
//       path,
//     ),
//   };
// };
// /* eslint-enable local/no-impure */
