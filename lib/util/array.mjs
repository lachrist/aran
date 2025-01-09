/* eslint-disable local/no-impure */

const {
  Math: { min, floor },
  Array,
  Array: {
    from: toArray,
    prototype: { flat: flatArray },
  },
  Set,
  Reflect: { apply },
} = globalThis;

/**
 * @type {(
 *   length: number,
 * ) => ArrayLike<undefined>}
 */
const makeEmptyArrayLike = (length) =>
  /** @type {any} */ ({ __proto__: null, length });

/** @type {never[] | []} */
export const EMPTY = [];

/** @type {<X, Y> (xs: X[], f: (x: X) => Y) => Y[]} */
export const map = toArray;

/**
 * @type {<X>(
 *   xs: X[],
 * ) => xs is []}
 */
export const isEmptyArray = (xs) => xs.length === 0;

/** @type {<X>(xs: X[]) => X[]}*/
export const reverse = (xs1) => {
  const { length: l } = xs1;
  return toArray(makeEmptyArrayLike(xs1.length), (_, i) => xs1[l - 1 - i]);
};

/** @type {(ss: string[], s: string) => string} */
export const join = (ss, s) => {
  const { length: l } = ss;
  if (l === 0) {
    return "";
  } else {
    let r = ss[0];
    for (let i = 1; i < l; i++) {
      r += `${s}${ss[i]}`;
    }
    return r;
  }
};

/** @type {(l: number) => number[]} */
export const enumerate = (l) => toArray(makeEmptyArrayLike(l), (_, i) => i);

/** @type {(l: number) => number[]} */
export const enumerateReverse = (l) =>
  toArray(makeEmptyArrayLike(l), (_, i) => l - 1 - i);

/**
 * @template X
 * @param {X[]} xs
 * @return {[X, X][]}
 */
export const pairupArray = (xs) =>
  toArray(makeEmptyArrayLike(floor(xs.length / 2)), (_, i) => [
    xs[2 * i],
    xs[2 * i + 1],
  ]);

/** @type {<X>(xs: X[]) => X[]} */
export const removeDuplicate = (xs) => toArray(new Set(xs));

/** @type {<X>(xs1: X[], i: number, j: number) => X[]} */
export const slice = (xs, i, j) =>
  toArray(makeEmptyArrayLike(j - i), (_, k) => xs[i + k]);

/**
 * @type {<X, Y extends X>(
 *   xs: X[],
 *   p: (x: X) => x is Y,
 * ) => null | Y}
 */
export const findNarrow = (xs, p) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    const x = xs[i];
    if (p(x)) {
      return x;
    }
  }
  return null;
};

/**
 * @type {<X>(
 *   xs: X[],
 *   p: (x: X) => boolean,
 * ) => null | X}
 */
export const find = (xs, p) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    const x = xs[i];
    if (p(x)) {
      return x;
    }
  }
  return null;
};

/**
 * @type {<X, Y>(
 *   xs: X[],
 *   p: (x: X) => null | Y,
 * ) => null | Y}
 */
export const findMap = (xs, p) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    const y = p(xs[i]);
    if (y !== null) {
      return y;
    }
  }
  return null;
};

/** @type {<X>(xss: X[][]) => X[]} */
export const flat = (xss) => apply(flatArray, xss, EMPTY);

/** @type {<X>(xs: X[]) => X} */
export const getLast = (xs) => xs[xs.length - 1];

/** @type {<X>(xs: X[], x: X) => boolean} */
export const includes = (xs, x) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    if (xs[i] === x) {
      return true;
    }
  }
  return false;
};

/** @type {<X>(xs: X[], f: (x: X) => boolean) => boolean} */
export const some = (xs, f) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    if (f(xs[i])) {
      return true;
    }
  }
  return false;
};

/** @type {(l: number, f: (i: number) => boolean) => boolean} */
export const someIndex = (l, f) => {
  for (let i = 0; i < l; i++) {
    if (f(i)) {
      return true;
    }
  }
  return false;
};

/** @type {<X, Y extends X>(xs: X[], f: (x: X) => x is Y) => xs is Y[]} */
export const everyNarrow = (xs, f) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    if (!f(xs[i])) {
      return false;
    }
  }
  return true;
};

/** @type {<X>(xs: X[], f: (x: X) => boolean) => boolean} */
export const every = /** @type {any} */ (everyNarrow);

/**
 * @type {<X, Y, Z> (
 *   xs: X[],
 *   f: (x: X, z: Z) => import("./pair").Pair<Y, Z>,
 *   z: Z,
 * ) => import("./pair").Pair<Y[], Z>}
 */
export const mapReduce = (xs, f, z) => {
  const { length: l } = xs;
  const ys = new Array(l);
  for (let i = 0; i < l; i++) {
    const { fst, snd } = f(xs[i], z);
    ys[i] = fst;
    z = snd;
  }
  return { fst: ys, snd: z };
};

/** @type {<Y> (l: number, f: (i: number) => Y) => Y[]} */
export const mapIndex = (l, f) =>
  toArray(makeEmptyArrayLike(l), (_, i) => f(i));

/** @type {<X, Y> (xs: X[], f: (x: X) => Y[]) => Y[]} */
export const flatMap = (xs, f) => {
  const ys1 = [];
  const { length: k } = xs;
  let c = 0;
  for (let i = 0; i < k; i++) {
    const ys2 = f(xs[i]);
    const { length: l } = ys2;
    for (let j = 0; j < l; j++) {
      ys1[c++] = ys2[j];
    }
  }
  return ys1;
};

/** @type {<Y> (k: number, f: (i: number) => Y[]) => Y[]} */
export const flatMapIndex = (k, f) => {
  const ys1 = [];
  let c = 0;
  for (let i = 0; i < k; i++) {
    const ys2 = f(i);
    const { length: l } = ys2;
    for (let j = 0; j < l; j++) {
      ys1[c++] = ys2[j];
    }
  }
  return ys1;
};

/**
 * @type {<X>(
 *   ... arrays: X[][]
 * ) => X[]}
 */
export const concat = (...xss) => {
  const ys = [];
  let l = 0;
  for (const xs of xss) {
    for (const x of xs) {
      ys[l++] = x;
    }
  }
  return ys;
};

/** @type {<X>(xs: X[], f: (x: X) => boolean) => X[]} */
export const filter = (xs1, f) => {
  const xs2 = [];
  let l2 = 0;
  const { length: l1 } = xs1;
  for (let i = 0; i < l1; i++) {
    const x = xs1[i];
    if (f(x)) {
      xs2[l2++] = x;
    }
  }
  return xs2;
};

/** @type {<X, Y>(xs: X[], f: (x: X) => null | Y) => Y[]} */
export const filterMap = (xs1, f) => {
  const ys = [];
  let l2 = 0;
  const { length: l1 } = xs1;
  for (let i = 0; i < l1; i++) {
    const y = f(xs1[i]);
    if (y !== null) {
      ys[l2++] = y;
    }
  }
  return ys;
};

export const filterNarrow =
  /** @type {<X, Y extends X>(xs: X[], f: (x: X) => x is Y) => Y[]} */ (filter);

/** @type {<X>(xs1: X[], f: (x: X) => boolean) => X[]} */
export const filterOut = (xs1, f) => {
  const xs2 = [];
  let l2 = 0;
  const { length: l1 } = xs1;
  for (let i = 0; i < l1; i++) {
    const x = xs1[i];
    if (!f(x)) {
      xs2[l2++] = x;
    }
  }
  return xs2;
};

/** @type {<X>(xs1: X[], xs2: X[]) => X[]} */
export const removeAll = (xs1, xs2) => filterOut(xs1, (x) => includes(xs2, x));

/** @type {<X>(xs: X[], x1: X) => X[]} */
export const remove = (xs, x1) => filter(xs, (x2) => x1 !== x2);

/** @type {<X, Y> (xs: X[], f: (y: Y, x: X) => Y, y: Y) => Y} */
export const reduce = (xs, f, y) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    y = f(y, xs[i]);
  }
  return y;
};

/** @type {<Y> (l: number, f: (y: Y, i: number) => Y, y: Y) => Y} */
export const reduceIndex = (l, f, y) => {
  for (let i = 0; i < l; i++) {
    y = f(y, i);
  }
  return y;
};

/** @type {<X, Y> (xs: X[], f: (y: Y, x: X) => Y, y: Y) => Y} */
export const reduceReverse = (xs, f, y) => {
  for (let i = xs.length - 1; i >= 0; i -= 1) {
    y = f(y, xs[i]);
  }
  return y;
};

/** @type {<X>(xs: X[], x: X) => number} */
export const indexOf = (xs, x) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    if (xs[i] === x) {
      return i;
    }
  }
  return -1;
};

/** @type {<X>(xs: X[], x: X) => number} */
export const lastIndexOf = (xs, x) => {
  for (let i = xs.length - 1; i >= 0; i -= 1) {
    if (xs[i] === x) {
      return i;
    }
  }
  return -1;
};

/** @type {<X>(xs: X[], p: (x: X) => boolean) => number} */
export const findFirstIndex = (xs, p) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i++) {
    if (p(xs[i])) {
      return i;
    }
  }
  return -1;
};

/** @type {<X>(xs: X[], p: (x: X) => boolean) => number} */
export const findLastIndex = (xs, p) => {
  const { length: l } = xs;
  for (let i = l - 1; i >= 0; i -= 1) {
    if (p(xs[i])) {
      return i;
    }
  }
  return -1;
};

/**
 * @template X
 * @template Y
 * @param {X[]} xs
 * @param {Y[]} ys
 * @return {[X, Y][]}
 */
export const zip = (xs, ys) =>
  toArray(makeEmptyArrayLike(min(xs.length, ys.length)), (_, i) => [
    xs[i],
    ys[i],
  ]);

/**
 * @template X
 * @param {X[]} xs
 * @return {[X, boolean][]}
 */
export const zipLast = (xs) => {
  const { length: l } = xs;
  return toArray(makeEmptyArrayLike(l), (_, i) => [xs[i], i === l - 1]);
};

/**
 * @template X
 * @template Y
 * @param {[X, Y][]} ps
 * @return {[X[], Y[]]}
 */
export const unzip = (ps) => {
  const empty = makeEmptyArrayLike(ps.length);
  return [
    toArray(empty, (_, i) => ps[i][0]),
    toArray(empty, (_, i) => ps[i][1]),
  ];
};

/**
 * @template X
 * @template {PropertyKey} K
 * @template V
 * @param {X[]} array
 * @param {(leaf: X) => K} getKey
 * @param {(leaf: X) => V} getVal
 * @returns {{ [key in K]?: V }}
 */
export const recordArray = (array, getKey, getVal) => {
  /** @type {{ [key in K]?: V }} */
  const record = /** @type {any} */ ({ __proto__: null });
  const { length } = array;
  for (let index = 0; index < length; index++) {
    const item = array[index];
    record[getKey(item)] = getVal(item);
  }
  return record;
};

export const recordArrayTotal = /**
 * @type {<X, K extends PropertyKey, V>(
 *  array: X[],
 *  getKey: (item: X) => K,
 *  getVal: (item: X) => V,
 * ) => { [key in K]: V }}
 */ (recordArray);

////////////
// Concat //
////////////

// 1 //

/**
 * @type {<X1>(
 *   xs: X1[],
 * ) => X1[]}
 */
export const concatX = (xs1) => xs1;

/**
 * @type {<X1>(
 *   xs: X1,
 * ) => X1[]}
 */
export const concat_ = (x1) => [x1];

// 2 //

/**
 * @type {<X1, X2>(
 *   xs1: X1[],
 *   xs2: X2[],
 * ) => (X1 | X2)[]}
 */
export const concatXX = (xs1, xs2) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  if (l1 === 0) {
    return xs2;
  } else if (l2 === 0) {
    return xs1;
  } else {
    const xs = new Array(l1 + l2);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + l1] = xs2[i2];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2>(
 *   x1: X1,
 *   xs2: X2[],
 * ) => (X1 | X2)[]}
 */
export const concat_X = (x1, xs2) => {
  const { length: l2 } = xs2;
  if (l2 === 0) {
    return [x1];
  } else {
    const xs = new Array(1 + l2);
    xs[0] = x1;
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + 1] = xs2[i2];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2>(
 *   xs1: X1[],
 *   x2: X2,
 * ) => (X1 | X2)[]}
 */
export const concatX_ = (xs1, x2) => {
  const { length: l1 } = xs1;
  if (l1 === 0) {
    return [x2];
  } else {
    const xs = new Array(l1 + 1);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    xs[l1] = x2;
    return xs;
  }
};

/**
 * @type {<X1, X2>(
 *   x1: X1,
 *   x2: X2,
 * ) => (X1 | X2)[]}
 */
export const concat__ = (x1, x2) => [x1, x2];

// 3 //

/**
 * @type {<X1, X2, X3>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 * ) => (X1 | X2 | X3)[]}
 */
export const concat___ = (x1, x2, x3) => [x1, x2, x3];

/**
 * @type {<X1, X2, X3>(
 *   x1: X1,
 *   xs2: X2[],
 *   x3: X3,
 * ) => (X1 | X2 | X3)[]}
 */
export const concat_X_ = (x1, xs2, x3) => {
  const { length: l2 } = xs2;
  if (l2 === 0) {
    return [x1, x3];
  } else {
    const xs = new Array(1 + l2 + 1);
    xs[0] = x1;
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + 1] = xs2[i2];
    }
    xs[l2 + 1] = x3;
    return xs;
  }
};

/**
 * @type {<X1, X2, X3>(
 *   x1: X1,
 *   xs2: X2[],
 *   xs3: X3[],
 * ) => (X1 | X2 | X3)[]}
 */
export const concat_XX = (x1, xs2, xs3) => {
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  if (l2 === 0 && l3 === 0) {
    return [x1];
  } else {
    const xs = new Array(1 + l2 + l3);
    xs[0] = x1;
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + 1] = xs2[i2];
    }
    for (let i3 = 0; i3 < l3; i3++) {
      xs[i3 + 1 + l2] = xs3[i3];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3>(
 *   xs1: X1[],
 *   xs2: X2,
 *   xs3: X3[],
 * ) => (X1 | X2 | X3)[]}
 */
export const concatX_X = (xs1, xs2, xs3) => {
  const { length: l1 } = xs1;
  const { length: l3 } = xs3;
  if (l1 === 0 && l3 === 0) {
    return [xs2];
  } else {
    const xs = new Array(l1 + 1 + l3);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    xs[l1] = xs2;
    for (let i3 = 0; i3 < l3; i3++) {
      xs[i3 + l1 + 1] = xs3[i3];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3>(
 *   xs1: X1[],
 *   xs2: X2[],
 *   xs3: X3[],
 * ) => (X1 | X2 | X3)[]}
 */
export const concatXXX = (xs1, xs2, xs3) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  if (l1 === 0) {
    if (l2 === 0) {
      return xs3;
    }
    if (l3 === 0) {
      return xs2;
    }
  } else if (l2 === 0 && l3 === 0) {
    return xs1;
  }
  const xs = new Array(l1 + l2 + l3);
  for (let i1 = 0; i1 < l1; i1++) {
    xs[i1] = xs1[i1];
  }
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + l1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + l1 + l2] = xs3[i3];
  }
  return xs;
};

/**
 * @type {<X1, X2, X3>(
 *   xs1: X1[],
 *   xs2: X2[],
 *   x3: X3,
 * ) => (X1 | X2 | X3)[]}
 */
export const concatXX_ = (xs1, xs2, x3) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  if (l1 === 0 && l2 === 0) {
    return [x3];
  } else {
    const xs = new Array(l1 + l2 + 1);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + l1] = xs2[i2];
    }
    xs[l1 + l2] = x3;
    return xs;
  }
};

/**
 * @type {<X1, X2, X3>(
 *   xs1: X1[],
 *   x2: X2,
 *   x3: X3,
 * ) => (X1 | X2 | X3)[]}
 */
export const concatX__ = (xs1, x2, x3) => {
  const { length: l1 } = xs1;
  if (l1 === 0) {
    return [x2, x3];
  } else {
    const xs = new Array(l1 + 1 + 1);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    xs[l1] = x2;
    xs[l1 + 1] = x3;
    return xs;
  }
};

/**
 * @type {<X1, X2, X3>(
 *   x1: X1,
 *   x2: X2,
 *   xs3: X3[],
 * ) => (X1 | X2 | X3)[]}
 */
export const concat__X = (x1, x2, xs3) => {
  const { length: l3 } = xs3;
  if (l3 === 0) {
    return [x1, x2];
  } else {
    const xs = new Array(1 + 1 + l3);
    xs[0] = x1;
    xs[1] = x2;
    for (let i3 = 0; i3 < l3; i3++) {
      xs[i3 + 2] = xs3[i3];
    }
    return xs;
  }
};

// 4 //

/**
 * @type {<X1, X2, X3, X4>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   x4: X4,
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concat____ = (x1, x2, x3, x4) => [x1, x2, x3, x4];

/**
 * @type {<X1, X2, X3, X4>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3[],
 *   x4: X4,
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concat__X_ = (x1, x2, xs3, x4) => {
  const { length: l3 } = xs3;
  if (l3 === 0) {
    return [x1, x2, x4];
  } else {
    const xs = new Array(1 + 1 + l3 + 1);
    xs[0] = x1;
    xs[1] = x2;
    for (let i3 = 0; i3 < l3; i3++) {
      xs[i3 + 2] = xs3[i3];
    }
    xs[l3 + 2] = x4;
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4>(
 *   x1: X1,
 *   x2: X2[],
 *   x3: X3,
 *   x4: X4[],
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concat_X_X = (x1, xs2, x3, xs4) => {
  const { length: l2 } = xs2;
  const { length: l4 } = xs4;
  if (l2 === 0 && l4 === 0) {
    return [x1, x3];
  } else {
    const xs = new Array(1 + l2 + 1 + l4);
    xs[0] = x1;
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + 1] = xs2[i2];
    }
    xs[l2 + 1] = x3;
    for (let i4 = 0; i4 < l4; i4++) {
      xs[i4 + 2 + l2] = xs4[i4];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   xs4: X4[],
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concat___X = (x1, x2, x3, xs4) => {
  const { length: l4 } = xs4;
  if (l4 === 0) {
    return [x1, x2, x3];
  } else {
    const xs = new Array(3 + l4);
    xs[0] = x1;
    xs[1] = x2;
    xs[2] = x3;
    for (let i4 = 0; i4 < l4; i4++) {
      xs[i4 + 3] = xs4[i4];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4>(
 *   xs1: X1[],
 *   xs2: X2[],
 *   xs3: X3[],
 *   x4: X4,
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concatXXX_ = (xs1, xs2, xs3, x4) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  const xs = new Array(l1 + l2 + l3 + 1);
  for (let i1 = 0; i1 < l1; i1++) {
    xs[i1] = xs1[i1];
  }
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + l1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + l1 + l2] = xs3[i3];
  }
  xs[l1 + l2 + l3] = x4;
  return xs;
};

/**
 * @type {<X1, X2, X3, X4>(
 *   x1: X1,
 *   xs2: X2[],
 *   xs3: X3[],
 *   xs4: X4[],
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concat_XXX = (x1, xs2, xs3, xs4) => {
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  const { length: l4 } = xs4;
  const xs = new Array(1 + l2 + l3 + l4);
  xs[0] = x1;
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + 1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + 1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4++) {
    xs[i4 + 1 + l2 + l3] = xs4[i4];
  }
  return xs;
};

/**
 * @type {<X1, X2, X3, X4>(
 *   xs1: X1[],
 *   xs2: X2[],
 *   xs3: X3[],
 *   xs4: X4[],
 * ) => (X1 | X2 | X3 | X4)[]}
 */
export const concatXXXX = (xs1, xs2, xs3, xs4) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  const { length: l4 } = xs4;
  if (l1 === 0) {
    if (l2 === 0) {
      if (l3 === 0) {
        return xs4;
      }
      if (l4 === 0) {
        return xs3;
      }
    }
    if (l3 === 0 && l4 === 0) {
      return xs2;
    }
  } else if (l2 === 0 && l3 === 0 && l4 === 0) {
    return xs1;
  }
  const xs = new Array(l1 + l2 + l3 + l4);
  for (let i1 = 0; i1 < l1; i1++) {
    xs[i1] = xs1[i1];
  }
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + l1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + l1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4++) {
    xs[i4 + l1 + l2 + l3] = xs4[i4];
  }
  return xs;
};

// 5 //

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   x1: X1,
 *   xs2: X2[],
 *   xs3: X3[],
 *   xs4: X4[],
 *   xs5: X5[],
 * ) => (X1 | X2 | X3 | X4 | X5)[]}
 */
export const concat_XXXX = (x1, xs2, xs3, xs4, xs5) => {
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  const { length: l4 } = xs4;
  const { length: l5 } = xs5;
  const xs = new Array(1 + l2 + l3 + l4 + l5);
  xs[0] = x1;
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + 1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + 1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4++) {
    xs[i4 + 1 + l2 + l3] = xs4[i4];
  }
  for (let i5 = 0; i5 < l5; i5++) {
    xs[i5 + 1 + l2 + l3 + l4] = xs5[i5];
  }
  return xs;
};

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   x4: X4,
 *   x5: X5[],
 * ) => (X1 | X2 | X3 | X4 | X5)[]}
 */
export const concat____X = (x1, x2, x3, x4, xs5) => {
  const { length: l5 } = xs5;
  if (l5 === 0) {
    return [x1, x2, x3, x4];
  } else {
    const xs = new Array(4 + l5);
    xs[0] = x1;
    xs[1] = x2;
    xs[2] = x3;
    xs[3] = x4;
    for (let i5 = 0; i5 < l5; i5++) {
      xs[i5 + 4] = xs5[i5];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   x4: X4,
 *   x5: X5,
 * ) => (X1 | X2 | X3 | X4 | X5)[]}
 */
export const concat_____ = (x1, x2, x3, x4, x5) => [x1, x2, x3, x4, x5];

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   xs4: X4[],
 *   x5: X5[],
 * ) => (X1 | X2 | X3 | X4 | X5)[]}
 */
export const concat___XX = (x1, x2, x3, xs4, xs5) => {
  const { length: l4 } = xs4;
  const { length: l5 } = xs5;
  if (l4 === 0 && l5 === 0) {
    return [x1, x2, x3];
  } else {
    const xs = new Array(3 + l4 + l5);
    xs[0] = x1;
    xs[1] = x2;
    xs[2] = x3;
    for (let i4 = 0; i4 < l4; i4++) {
      xs[i4 + 3] = xs4[i4];
    }
    for (let i5 = 0; i5 < l5; i5++) {
      xs[i5 + 3 + l4] = xs5[i5];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4, X5, X6>(
 *   xs1: X1[],
 *   xs2: X2[],
 *   x3: X3,
 *   xs4: X4[],
 *   x5: X5,
 *   x6: X6,
 * ) => (X1 | X2 | X3 | X4 | X5 | X6)[]}
 */
export const concatXX_X__ = (xs1, xs2, x3, xs4, x5, x6) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  const { length: l4 } = xs4;
  if (l1 === 0 && l2 === 0 && l4 === 0) {
    return [x3, x5, x6];
  } else {
    const xs = new Array(l1 + l2 + 1 + l4 + 1 + 1);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    for (let i2 = 0; i2 < l2; i2++) {
      xs[i2 + l1] = xs2[i2];
    }
    xs[l1 + l2] = x3;
    for (let i4 = 0; i4 < l4; i4++) {
      xs[i4 + 1 + l1 + l2] = xs4[i4];
    }
    xs[l1 + l2 + 1 + l4] = x5;
    xs[l1 + l2 + 1 + l4 + 1] = x6;
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   xs1: X1[],
 *   x2: X2,
 *   xs3: X3[],
 *   x4: X4,
 *   x5: X5[],
 * ) => (X1 | X2 | X3 | X4 | X5)[]}
 */
export const concatX_X_X = (xs1, x2, xs3, x4, xs5) => {
  const { length: l1 } = xs1;
  const { length: l3 } = xs3;
  const { length: l5 } = xs5;
  if (l1 === 0 && l3 === 0 && l5 === 0) {
    return [x2, x4];
  } else {
    const xs = new Array(l1 + 1 + l3 + 1 + l5);
    for (let i1 = 0; i1 < l1; i1++) {
      xs[i1] = xs1[i1];
    }
    xs[l1] = x2;
    for (let i3 = 0; i3 < l3; i3++) {
      xs[i3 + 1 + l1] = xs3[i3];
    }
    xs[l1 + 1 + l3] = x4;
    for (let i5 = 0; i5 < l5; i5++) {
      xs[i5 + 1 + l1 + l3 + 1] = xs5[i5];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4, X5, X6, X7>(
 *  xs1: X1,
 *  xs2: X2,
 *  xs3: X3,
 *  xs4: X4,
 *  xs5: X5,
 *  xs6: X6,
 *  xs7: X7[],
 * ) => (X1 | X2 | X3 | X4 | X5 | X6 | X7)[]}
 */
export const concat______X = (x1, x2, x3, x4, x5, x6, xs7) => {
  const { length: l7 } = xs7;
  if (l7 === 0) {
    return [x1, x2, x3, x4, x5, x6];
  } else {
    const xs = new Array(6 + l7);
    xs[0] = x1;
    xs[1] = x2;
    xs[2] = x3;
    xs[3] = x4;
    xs[4] = x5;
    xs[5] = x6;
    for (let i7 = 0; i7 < l7; i7++) {
      xs[i7 + 6] = xs7[i7];
    }
    return xs;
  }
};

/**
 * @type {<X1, X2, X3, X4, X5>(
 *  xs1: X1[],
 *  xs2: X2[],
 *  xs3: X3[],
 *  xs4: X4[],
 *  xs5: X5[],
 * ) => (X1 | X2 | X3 | X4 | X5)[]}
 */
export const concatXXXXX = (xs1, xs2, xs3, xs4, xs5) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  const { length: l4 } = xs4;
  const { length: l5 } = xs5;
  if (l1 === 0) {
    if (l2 === 0) {
      if (l3 === 0) {
        if (l4 === 0) {
          return xs5;
        }
        if (l5 === 0) {
          return xs4;
        }
      } else if (l4 === 0 && l5 === 0) {
        return xs3;
      }
    } else if (l3 === 0 && l4 === 0 && l5 === 0) {
      return xs2;
    }
  } else if (l2 === 0 && l3 === 0 && l4 === 0 && l5 === 0) {
    return xs1;
  }
  const xs = new Array(l1 + l2 + l3 + l4 + l5);
  for (let i1 = 0; i1 < l1; i1++) {
    xs[i1] = xs1[i1];
  }
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + l1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + l1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4++) {
    xs[i4 + l1 + l2 + l3] = xs4[i4];
  }
  for (let i5 = 0; i5 < l5; i5++) {
    xs[i5 + l1 + l2 + l3 + l4] = xs5[i5];
  }
  return xs;
};

/**
 * @type {<X1, X2, X3, X4, X5, X6>(
 *  xs1: X1[],
 *  xs2: X2[],
 *  xs3: X3[],
 *  xs4: X4[],
 *  xs5: X5[],
 *  xs6: X6[],
 * ) => (X1 | X2 | X3 | X4 | X5 | X6)[]}
 */
export const concatXXXXXX = (xs1, xs2, xs3, xs4, xs5, xs6) => {
  const { length: l1 } = xs1;
  const { length: l2 } = xs2;
  const { length: l3 } = xs3;
  const { length: l4 } = xs4;
  const { length: l5 } = xs5;
  const { length: l6 } = xs6;
  const xs = new Array(l1 + l2 + l3 + l4 + l5);
  for (let i1 = 0; i1 < l1; i1++) {
    xs[i1] = xs1[i1];
  }
  for (let i2 = 0; i2 < l2; i2++) {
    xs[i2 + l1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3++) {
    xs[i3 + l1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4++) {
    xs[i4 + l1 + l2 + l3] = xs4[i4];
  }
  for (let i5 = 0; i5 < l5; i5++) {
    xs[i5 + l1 + l2 + l3 + l4] = xs5[i5];
  }
  for (let i6 = 0; i6 < l6; i6++) {
    xs[i6 + l1 + l2 + l3 + l4 + l5] = xs6[i6];
  }
  return xs;
};
