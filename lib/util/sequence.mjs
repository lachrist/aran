// For haskell programmers out there: this is the writer monad on lists.

import {
  EMPTY,
  compileGet,
  filterNarrowTree,
  map,
  splitTree,
} from "./index.mjs";

const {
  Array: { from: toArray },
} = globalThis;

const getWrite = compileGet("write");

const getValue = compileGet("value");

/**
 * @type {import("./sequence.d.ts").Sequence<never, never[]>}
 */
export const EMPTY_SEQUENCE = { write: null, value: EMPTY };

/**
 * @type {import("./sequence.d.ts").Sequence<never, null>}
 */
export const NULL_SEQUENCE = { write: null, value: null };

/////////////
// Generic //
/////////////

/**
 * @type {<W, X>(
 *   write: import("./tree.d.ts").Tree<W>,
 *   value: X,
 * ) => import("./sequence.d.ts").Sequence<W, X>}
 */
export const initSequence = (write, value) => ({
  write,
  value,
});

/**
 * @type {<W1, W2, X>(
 *   write: import("./tree.d.ts").Tree<W1>,
 *   sequence: import("./sequence.d.ts").Sequence<W2, X>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, X>}
 */
export const prependSequence = (write1, { write: write2, value }) => ({
  write: [write1, write2],
  value,
});

/**
 * @type {<W1, W2, X>(
 *   write: import("./tree.d.ts").Tree<W1>,
 *   sequence: import("./sequence.d.ts").Sequence<W2, X>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, X>}
 */
export const appendSequence = (write2, { write: write1, value }) => ({
  write: [write1, write2],
  value,
});

/**
 * @type {<W, V extends W, X>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 *   predicate: (word: W) => word is V,
 * ) => import("./sequence.d.ts").Sequence<V, X>}
 */
export const filterSequence = ({ write, value }, predicate) => ({
  write: filterNarrowTree(write, predicate),
  value,
});

/**
 * @type {<W, V extends W, X>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 *   predicate: (word: W) => word is V,
 * ) => import("./sequence.d.ts").Sequence<Exclude<W, V>, [V[], X]>}
 */
export const extractSequence = ({ write, value }, predicate) => {
  const { 0: write1, 1: write2 } = splitTree(write, predicate);
  return { write: write2, value: [write1, value] };
};

/**
 * @type {<W>(
 *   write: import("./tree.d.ts").Tree<W>,
 * ) => import("./sequence.d.ts").Sequence<W, null>}
 */
export const tellSequence = (write) => ({ write, value: null });

/**
 * @type {<X>(
 *   value: X,
 * ) => import("./sequence.d.ts").Sequence<never, X>}
 */
export const zeroSequence = (value) => ({ write: null, value });

/**
 * @type {<W, X>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 * ) => import("./sequence.d.ts").Sequence<W, null>}
 */
export const dropSequence = ({ write }) => ({
  write,
  value: null,
});

/**
 * @type {<W, X>(
 *   sequence: import("./sequence.d.ts").Sequence<W, X>,
 * ) => import("./tree.d.ts").Tree<W>}
 */
export const listenSequence = ({ write }) => write;

/**
 * @type {<W, X, Y>(
 *   mappee: import("./sequence.d.ts").Sequence<W, X>,
 *   update: (value: X) => Y,
 * ) => import("./sequence.d.ts").Sequence<W, Y>}
 */
export const mapSequence = ({ write, value }, update) => ({
  write,
  value: update(value),
});

/* eslint-disable local/no-impure */
/**
 * @type {<W, X, Y, Z>(
 *   array: X[],
 *   accumulate: (value: X, state: Z) => import("./sequence.d.ts").Sequence<W, [Y, Z]>,
 *   state: Z,
 * ) => import("./sequence.d.ts").Sequence<W, [Y[], Z]>}
 */
export const mapReduceSequence = (array, accumulate, state) => {
  const { length } = array;
  /** @type {any[]} */
  const write = toArray({
    // @ts-ignore
    __proto__: null,
    length,
  });
  const value = toArray({
    // @ts-ignore
    __proto__: null,
    length,
  });
  for (let index = 0; index < length; index++) {
    const sequence = accumulate(array[index], state);
    write[index] = sequence.write;
    value[index] = sequence.value;
  }
  return { write, value: [value, state] };
};
/* eslint-enable local/no-impure */

/**
 * @type {<W1, X1, W2, X2, Y>(
 *   mappee1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   mappee2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   update: (value1: X1, value2: X2) => Y,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, Y>}
 */
export const mapTwoSequence = (
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  update,
) => ({
  write: [write1, write2],
  value: update(value1, value2),
});

/**
 * @type {<W1, W2, X, Y>(
 *   sequence: import("./sequence.d.ts").Sequence<W1, X>,
 *   kontinue: (
 *     value: X,
 *   ) => import("./sequence.d.ts").Sequence<W2, Y>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, Y>}
 */
export const bindSequence = ({ write: write1, value: value1 }, kontinue) => {
  const { write, value } = kontinue(value1);
  return { write: [write1, write], value };
};

/**
 * @type {<W1, X1, W2, X2, W, Y>(
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   kontinue: (
 *     value1: X1,
 *     value2: X2,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W, Y>}
 */
export const bindTwoSequence = (
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  kontinue,
) => {
  const { write, value } = kontinue(value1, value2);
  return { write: [write1, write2, write], value };
};

/**
 * @type {<W1, W2, X1, X2>(
 *  sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *  sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, X2>}
 */
export const thenSequence = (
  { write: write1 },
  { write: write2, value: value2 },
) => ({
  write: [write1, write2],
  value: value2,
});

/**
 * @type {<W, X>(
 *   sequences: import("./sequence.d.ts").Sequence<W, X>[],
 * ) => import("./sequence.d.ts").Sequence<W, X[]>}
 */
export const flatSequence = (sequences) => ({
  write: map(sequences, getWrite),
  value: map(sequences, getValue),
});

//////////
// Lift //
//////////

/**
 * @type {<X1, Y>(
 *   liftee: (value: X1) => Y,
 *   pure1: X1,
 * ) => import("./sequence.d.ts").Sequence<never, Y>}
 */
export const liftSequence_ = (liftee, value) => ({
  write: null,
  value: liftee(value),
});

/**
 * @type {<X1, W2, X2, X3, W4, X4, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *   ) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   pure3: X3,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W2 | W4, Y>}
 */
export const liftSequence_X_X = (
  liftee,
  value1,
  { write: write2, value: value2 },
  value3,
  { write: write4, value: value4 },
) => ({
  write: [write2, write4],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, X1, X2, W3, X3, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *   ) => Y,
 *   sequence2: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure3: X2,
 *   sequence4: import("./sequence.d.ts").Sequence<W3, X3>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W3, Y>}
 */
export const liftSequenceX_X = (
  liftee,
  { write: write1, value: value1 },
  value2,
  { write: write3, value: value3 },
) => ({
  write: [write1, write3],
  value: liftee(value1, value2, value3),
});

/**
 * @type {<W1, X1, Y>(
 *   liftee: (value1: X1) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 * ) => import("./sequence.d.ts").Sequence<W1, Y>}
 */
export const liftSequenceX = (liftee, { write: write1, value: value1 }) => ({
  write: write1,
  value: liftee(value1),
});

/**
 * @type {<W1, W2, X1, X2, Y>(
 *   liftee: (value1: X1, value2: X2) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, Y>}
 */
export const liftSequenceXX = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
) => ({
  write: [write1, write2],
  value: liftee(value1, value2),
});

/**
 * @type {<W2, X1, X2, Y>(
 *   liftee: (value1: X1, value2: X2) => Y,
 *   sequence1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 * ) => import("./sequence.d.ts").Sequence<W2, Y>}
 */
export const liftSequence_X = (
  liftee,
  value1,
  { write: write2, value: value2 },
) => ({
  write: write2,
  value: liftee(value1, value2),
});

/**
 * @type {<W1, X1, X2, Y>(
 *   liftee: (value1: X1, value2: X2) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 * ) => import("./sequence.d.ts").Sequence<W1, Y>}
 */
export const liftSequenceX_ = (
  liftee,
  { write: write1, value: value1 },
  value2,
) => ({
  write: write1,
  value: liftee(value1, value2),
});

/**
 * @type {<X1, X2, Y>(
 *   liftee: (value1: X1, value2: X2) => Y,
 *   pure1: X1,
 *   pure2: X2,
 * ) => import("./sequence.d.ts").Sequence<never, Y>}
 */
export const liftSequence__ = (liftee, value1, value2) => ({
  write: null,
  value: liftee(value1, value2),
});

/**
 * @type {<W1, W2, X1, X2, X3, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   pure3: X3,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, Y>}
 */
export const liftSequenceXX_ = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  value3,
) => ({
  write: [write1, write2],
  value: liftee(value1, value2, value3),
});

/**
 * @type {<X1, X2, X3, W3, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence2: import("./sequence.d.ts").Sequence<W3, X3>,
 * ) => import("./sequence.d.ts").Sequence<W3, Y>}
 */
export const liftSequence__X = (
  liftee,
  value1,
  value2,
  { write: write3, value: value3 },
) => ({
  write: write3,
  value: liftee(value1, value2, value3),
});

/**
 * @type {<W2, X1, X2, X3, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   pure3: X3,
 * ) => import("./sequence.d.ts").Sequence<W2, Y>}
 */
export const liftSequence_X_ = (
  liftee,
  value1,
  { write: write2, value: value2 },
  value3,
) => ({
  write: write2,
  value: liftee(value1, value2, value3),
});

/**
 * @type {<W1, W2, W3, X1, X2, X3, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W3, Y>}
 */
export const liftSequenceXXX = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  { write: write3, value: value3 },
) => ({
  write: [write1, write2, write3],
  value: liftee(value1, value2, value3),
});

/**
 * @type {<W2, W3, X1, X2, X3, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 * ) => import("./sequence.d.ts").Sequence<W2 | W3, Y>}
 */
export const liftSequence_XX = (
  liftee,
  value1,
  { write: write2, value: value2 },
  { write: write3, value: value3 },
) => ({
  write: [write2, write3],
  value: liftee(value1, value2, value3),
});

/**
 * @type {<W1, X1, X2, X3, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 * ) => import("./sequence.d.ts").Sequence<W1, Y>}
 */
export const liftSequenceX__ = (
  liftee,
  { write: write1, value: value1 },
  value2,
  value3,
) => ({
  write: write1,
  value: liftee(value1, value2, value3),
});

/**
 * @type {<W1, W2, W3, W4, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W3 | W4, Y>}
 */
export const liftSequenceXXXX = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  { write: write3, value: value3 },
  { write: write4, value: value4 },
) => ({
  write: [write1, write2, write3, write4],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W2, W3, W4, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W2 | W3 | W4, Y>}
 */
export const liftSequence_XXX = (
  liftee,
  value1,
  { write: write2, value: value2 },
  { write: write3, value: value3 },
  { write: write4, value: value4 },
) => ({
  write: [write2, write3, write4],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, W2, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   pure3: X3,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2, Y>}
 */
export const liftSequenceXX__ = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  value3,
  value4,
) => ({
  write: [write1, write2],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, W3, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W1 | W3, Y>}
 */
export const liftSequenceX_X_ = (
  liftee,
  { write: write1, value: value1 },
  value2,
  { write: write3, value: value3 },
  value4,
) => ({
  write: [write1, write3],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, W4, X1, X2, X3, X4, X5, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4, value5: X5) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence.d.ts").Sequence<W1 | W4, Y>}
 */
export const liftSequenceX__X_ = (
  liftee,
  { write: write1, value: value1 },
  value2,
  value3,
  { write: write4, value: value4 },
  value5,
) => ({
  write: [write1, write4],
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<W1, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W1, Y>}
 */
export const liftSequenceX___ = (
  liftee,
  { write: write1, value: value1 },
  value2,
  value3,
  value4,
) => ({
  write: write1,
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, W2, W3, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W3, Y>}
 */
export const liftSequenceXXX_ = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  { write: write3, value: value3 },
  value4,
) => ({
  write: [write1, write2, write3],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, W4, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure4: X3,
 *   sequence3: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W4, Y>}
 */
export const liftSequenceX__X = (
  liftee,
  { write: write1, value: value1 },
  value2,
  value3,
  { write: write4, value: value4 },
) => ({
  write: [write1, write4],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W2, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   pure3: X3,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W2, Y>}
 */
export const liftSequence_X__ = (
  liftee,
  value1,
  { write: write2, value: value2 },
  value3,
  value4,
) => ({
  write: write2,
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W4, X1, X2, X3, X4, X5, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4, value5: X5) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence2: import("./sequence.d.ts").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence.d.ts").Sequence<W4, Y>}
 */
export const liftSequence___X_ = (
  liftee,
  value1,
  value2,
  value3,
  { write: write4, value: value4 },
  value5,
) => ({
  write: write4,
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<W3, X1, X2, X3, X4, Y>(
 *   liftee: (value1: X1, value2: X2, value3: X3, value4: X4) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W3, Y>}
 */
export const liftSequence__X_ = (
  liftee,
  value1,
  value2,
  { write: write3, value: value3 },
  value4,
) => ({
  write: write3,
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<X1, X2, W3, X3, W4, X4, X5, X6, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *     value6: X6,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 *   pure5: X5,
 *   pure6: X6,
 * ) => import("./sequence.d.ts").Sequence<W3 | W4, Y>}
 */
export const liftSequence__XX__ = (
  liftee,
  value1,
  value2,
  { write: write3, value: value3 },
  { write: write4, value: value4 },
  value5,
  value6,
) => ({
  write: [write3, write4],
  value: liftee(value1, value2, value3, value4, value5, value6),
});

/**
 * @type {<X1, X2, X3, W4, X4, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W4, Y>}
 */
export const liftSequence___X = (
  liftee,
  value1,
  value2,
  value3,
  { write: write4, value: value4 },
) => ({
  write: write4,
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<X1, X2, X3, W4, X4, X5, X6, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *     value6: X6,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence3: import("./sequence.d.ts").Sequence<W4, X4>,
 *   pure5: X5,
 *   pure6: X6,
 * ) => import("./sequence.d.ts").Sequence<W4, Y>}
 */
export const liftSequence___X__ = (
  liftee,
  value1,
  value2,
  value3,
  { write: write4, value: value4 },
  value5,
  value6,
) => ({
  write: write4,
  value: liftee(value1, value2, value3, value4, value5, value6),
});

/**
 * @type {<W1, X1, X2, X3, X4, W5, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 *   sequence5: import("./sequence.d.ts").Sequence<W5, X5>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W5, Y>}
 */
export const liftSequenceX___X = (
  liftee,
  { write: write1, value: value1 },
  value2,
  value3,
  value4,
  { write: write5, value: value5 },
) => ({
  write: [write1, write5],
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<W1, W3, W4, X1, X2, X3, X4, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *   ) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W3 | W4, Y>}
 */
export const liftSequenceX_XX = (
  liftee,
  { write: write1, value: value1 },
  value2,
  { write: write3, value: value3 },
  { write: write4, value: value4 },
) => ({
  write: [write1, write3, write4],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<W1, X1, X2, W3, X3, X4, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 *   pure5: X5,
 * ) => import("./sequence.d.ts").Sequence<W1 | W3, Y>}
 */
export const liftSequenceX_X__ = (
  liftee,
  { write: write1, value: value1 },
  value2,
  { write: write3, value: value3 },
  value4,
  value5,
) => ({
  write: [write1, write3],
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<X1, W2, X2, W3, X3, X4, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *   ) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W2 | W3, Y>}
 */
export const liftSequence_XX_ = (
  liftee,
  value1,
  { write: write2, value: value2 },
  { write: write3, value: value3 },
  value4,
) => ({
  write: [write2, write3],
  value: liftee(value1, value2, value3, value4),
});

/**
 * @type {<X1, X2, X3, X4, W5, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 *   sequence5: import("./sequence.d.ts").Sequence<W5, X5>,
 * ) => import("./sequence.d.ts").Sequence<W5, Y>}
 */
export const liftSequence____X = (
  liftee,
  value1,
  value2,
  value3,
  value4,
  { write: write5, value: value5 },
) => ({
  write: write5,
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<X1, W2, X2, W3, X3, W4, X4, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence.d.ts").Sequence<W2 | W3 | W4, Y>}
 */
export const liftSequence_XXX_ = (
  liftee,
  value1,
  { write: write2, value: value2 },
  { write: write3, value: value3 },
  { write: write4, value: value4 },
  value5,
) => ({
  write: [write2, write3, write4],
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<W1, X1, W2, X2, W3, X3, W4, X4, W5, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 *   sequence5: import("./sequence.d.ts").Sequence<W5, X5>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W3 | W4 | W5, Y>}
 */
export const liftSequenceXXXXX = (
  liftee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  { write: write3, value: value3 },
  { write: write4, value: value4 },
  { write: write5, value: value5 },
) => ({
  write: [write1, write2, write3, write4, write5],
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<X1, X2, W3, X3, W4, X4, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   value1: X1,
 *   value2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 *   value5: X5,
 * ) => import("./sequence.d.ts").Sequence<W3 | W4, Y>}
 */
export const liftSequence__XX_ = (
  liftee,
  value1,
  value2,
  { write: write3, value: value3 },
  { write: write4, value: value4 },
  value5,
) => ({
  write: [write3, write4],
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<X1, X2, W3, X3, W4, X4, X5, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => Y,
 *   value1: X1,
 *   value2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   value4: X4,
 *   value5: X5,
 * ) => import("./sequence.d.ts").Sequence<W3 | W4, Y>}
 */
export const liftSequence__X__ = (
  liftee,
  value1,
  value2,
  { write: write3, value: value3 },
  value4,
  value5,
) => ({
  write: write3,
  value: liftee(value1, value2, value3, value4, value5),
});

/**
 * @type {<W1, X1, X2, W3, X3, W4, X4, X5, X6, W7, X7, Y>(
 *   liftee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *     value6: X6,
 *     value7: X7,
 *   ) => Y,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 *   pure5: X5,
 *   pure6: X6,
 *   sequence7: import("./sequence.d.ts").Sequence<W7, X7>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W3 | W7, Y>}
 */
export const liftSequenceX_X___X = (
  liftee,
  { write: write1, value: value1 },
  value2,
  { write: write3, value: value3 },
  value4,
  value5,
  value6,
  { write: write7, value: value7 },
) => ({
  write: [write1, write3, write7],
  value: liftee(value1, value2, value3, value4, value5, value6, value7),
});

//////////
// Call //
//////////

/**
 * @type {<W1, X1, W, X>(
 *   callee: (
 *     value1: X1,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 * ) => import("./sequence.d.ts").Sequence<W | W1, X>}
 */
export const callSequenceX = (callee, { write: write1, value: value1 }) => {
  const { write, value } = callee(value1);
  return { write: [write1, write], value };
};

/**
 * @type {<X1, X2, X3, W4, X4, X5, W, X>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 *   pure5: X5,
 * ) => import("./sequence.d.ts").Sequence<W4 | W, X>}
 */
export const callSequence___X_ = (
  callee,
  value1,
  value2,
  value3,
  { write: write4, value: value4 },
  value5,
) => {
  const { write, value } = callee(value1, value2, value3, value4, value5);
  return { write: [write4, write], value };
};

/**
 * @type {<X1, X2, X3, X4, W5, X5, W, X>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 *   sequence5: import("./sequence.d.ts").Sequence<W5, X5>,
 * ) => import("./sequence.d.ts").Sequence<W5 | W, X>}
 */
export const callSequence____X = (
  callee,
  value1,
  value2,
  value3,
  value4,
  { write: write5, value: value5 },
) => {
  const { write, value } = callee(value1, value2, value3, value4, value5);
  return { write: [write5, write], value };
};

/**
 * @type {<X1, X2, X3, X4, X5, W6, X6, W, X>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *     value5: X5,
 *     value6: X6,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   pure4: X4,
 *   pure5: X5,
 *   sequence6: import("./sequence.d.ts").Sequence<W6, X6>,
 * ) => import("./sequence.d.ts").Sequence<W6 | W, X>}
 */
export const callSequence_____X = (
  callee,
  value1,
  value2,
  value3,
  value4,
  value5,
  { write: write6, value: value6 },
) => {
  const { write, value } = callee(
    value1,
    value2,
    value3,
    value4,
    value5,
    value6,
  );
  return { write: [write6, write], value };
};

/**
 * @type {<W1, X1, W2, X2, W, X>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W, X>}
 */
export const callSequenceXX = (
  callee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
) => {
  const { write, value } = callee(value1, value2);
  return { write: [write1, write2, write], value };
};

/**
 * @type {<X1, W2, X2, W, X>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 * ) => import("./sequence.d.ts").Sequence<W2 | W, X>}
 */
export const callSequence_X = (
  callee,
  value1,
  { write: write2, value: value2 },
) => {
  const { write, value } = callee(value1, value2);
  return { write: [write2, write], value };
};

/**
 * @type {<X1, W2, X2, X3, W, X>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *   ) => import("./sequence.d.ts").Sequence<W, X>,
 *   pure1: X1,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   pure3: X3,
 * ) => import("./sequence.d.ts").Sequence<W | W2, X>}
 */
export const callSequence_X_ = (
  callee,
  value1,
  { write: write2, value: value2 },
  value3,
) => {
  const { write, value } = callee(value1, value2, value3);
  return { write: [write2, write], value };
};

/**
 * @type {<W1, X1, W2, X2, W3, X3, W4, Y>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *   ) => import("./sequence.d.ts").Sequence<W4, Y>,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   sequence2: import("./sequence.d.ts").Sequence<W2, X2>,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 * ) => import("./sequence.d.ts").Sequence<W1 | W2 | W3 | W4, Y>}
 */
export const callSequenceXXX = (
  callee,
  { write: write1, value: value1 },
  { write: write2, value: value2 },
  { write: write3, value: value3 },
) => {
  const { write, value } = callee(value1, value2, value3);
  return { write: [write1, write2, write3, write], value };
};

/**
 * @type {<X1, X2, W3, X3, W4, Y>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *   ) => import("./sequence.d.ts").Sequence<W4, Y>,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 * ) => import("./sequence.d.ts").Sequence<W3 | W4, Y>}
 */
export const callSequence__X = (
  callee,
  value1,
  value2,
  { write: write3, value: value3 },
) => {
  const { write, value } = callee(value1, value2, value3);
  return { write: [write3, write], value };
};

/**
 * @type {<X1, X2, W3, X3, X4, W, Y>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 *   pure1: X1,
 *   pure2: X2,
 *   sequence3: import("./sequence.d.ts").Sequence<W3, X3>,
 *   pure4: X4,
 * ) => import("./sequence.d.ts").Sequence<W3 | W, Y>}
 *
 */
export const callSequence__X_ = (
  callee,
  value1,
  value2,
  { write: write3, value: value3 },
  value4,
) => {
  const { write, value } = callee(value1, value2, value3, value4);
  return { write: [write3, write], value };
};

/**
 * @type {<X1, X2, X3, W4, X4, W, Y>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *     value4: X4,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 *   pure1: X1,
 *   pure2: X2,
 *   pure3: X3,
 *   sequence4: import("./sequence.d.ts").Sequence<W4, X4>,
 * ) => import("./sequence.d.ts").Sequence<W4 | W, Y>}
 */
export const callSequence___X = (
  callee,
  value1,
  value2,
  value3,
  { write: write4, value: value4 },
) => {
  const { write, value } = callee(value1, value2, value3, value4);
  return { write: [write4, write], value };
};

/**
 * @type {<W1, X1, X2, X3, W, Y>(
 *   callee: (
 *     value1: X1,
 *     value2: X2,
 *     value3: X3,
 *   ) => import("./sequence.d.ts").Sequence<W, Y>,
 *   sequence1: import("./sequence.d.ts").Sequence<W1, X1>,
 *   pure2: X2,
 *   pure3: X3,
 * ) => import("./sequence.d.ts").Sequence<W1 | W, Y>}
 */
export const callSequenceX__ = (
  callee,
  { write: write1, value: value1 },
  value2,
  value3,
) => {
  const { write, value } = callee(value1, value2, value3);
  return { write: [write1, write], value };
};
