/* eslint-disable no-param-reassign */
/* eslint-disable local/no-impure */

const {
  Math: { min, floor },
  Array,
  Array: { from: toArray },
  Set,
} = globalThis;

/** @type {never[]} */
export const EMPTY = [];

/** @type {<X>(xs: X[]) => X[]}*/
export const reverse = (xs1) => {
  const xs2 = [];
  let l2 = 0;
  const { length: l1 } = xs1;
  for (let i = l1 - 1; i >= 0; i -= 1) {
    xs2[l2] = xs1[i];
    l2 += 1;
  }
  return xs2;
};

/** @type {(ss: string[], s: string) => string} */
export const join = (ss, s) => {
  const { length: l } = ss;
  if (l === 0) {
    return "";
  } else {
    let r = ss[0];
    for (let i = 1; i < l; i += 1) {
      r += `${s}${ss[i]}`;
    }
    return r;
  }
};

/** @type {(l: number) => number[]} */
export const enumerate = (l) => {
  const xs = new Array(l);
  for (let i = 0; i < l; i += 1) {
    xs[i] = i;
  }
  return xs;
};

/**
 * @template X
 * @param {X[]} xs
 * @return {[X, X][]}
 */
export const pairupArray = (xs) => {
  const l = floor(xs.length / 2);
  /** @type {[X, X][]} */
  const ps = [];
  for (let i = 0; i < l; i += 1) {
    ps[i] = [xs[2 * i], xs[2 * i + 1]];
  }
  return ps;
};

/** @type {<X>(xs: X[]) => X[]} */
export const removeDuplicate = (xs) => toArray(new Set(xs));

/** @type {<X>(xs1: X[], i: number, j: number) => X[]} */
export const slice = (xs1, i, j) => {
  const xs2 = [];
  let l2 = 0;
  while (i < j) {
    xs2[l2] = xs1[i];
    l2 += 1;
    i += 1;
  }
  return xs2;
};

/** @type {<X>(xss: X[][]) => X[]} */
export const flat = (xss) => {
  const { length: l1 } = xss;
  let l2 = 0;
  for (let i = 0; i < l1; i += 1) {
    l2 += xss[i].length;
  }
  const xs = new Array(l2);
  l2 = 0;
  for (let i = 0; i < l1; i += 1) {
    const xs2 = xss[i];
    const { length: l3 } = xs2;
    for (let j = 0; j < l3; j += 1) {
      xs[l2] = xs2[j];
      l2 += 1;
    }
  }
  return xs;
};

/** @type {<X>(xs: X[]) => X} */
export const getLast = (xs) => xs[xs.length - 1];

/** @type {<X>(xs: X[], x: X) => boolean} */
export const includes = (xs, x) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i += 1) {
    if (xs[i] === x) {
      return true;
    }
  }
  return false;
};

/** @type {<X>(xs: X[], f: (x: X) => boolean) => boolean} */
export const some = (xs, f) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i += 1) {
    if (f(xs[i])) {
      return true;
    }
  }
  return false;
};

/** @type {<X, Y extends X>(xs: X[], f: (x: X) => x is Y) => xs is Y[]} */
export const every = (xs, f) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i += 1) {
    if (!f(xs[i])) {
      return false;
    }
  }
  return true;
};

/** @type {<X, Y> (xs: X[], f: (x: X) => Y) => Y[]} */
export const map = (xs, f) => {
  const { length: l } = xs;
  const ys = new Array(l);
  for (let i = 0; i < l; i += 1) {
    ys[i] = f(xs[i]);
  }
  return ys;
};

/** @type {<Y> (l: number, f: (i: number) => Y) => Y[]} */
export const mapIndex = (l, f) => {
  const ys = new Array(l);
  for (let i = 0; i < l; i += 1) {
    ys[i] = f(i);
  }
  return ys;
};

/** @type {<X, Y> (xs: X[], f: (x: X) => Y[]) => Y[]} */
export const flatMap = (xs, f) => {
  const ys1 = [];
  const { length: k } = xs;
  let c = 0;
  for (let i = 0; i < k; i += 1) {
    const ys2 = f(xs[i]);
    const { length: l } = ys2;
    for (let j = 0; j < l; j += 1) {
      ys1[c] = ys2[j];
      c += 1;
    }
  }
  return ys1;
};

/** @type {<Y> (k: number, f: (i: number) => Y[]) => Y[]} */
export const flatMapIndex = (k, f) => {
  const ys1 = [];
  let c = 0;
  for (let i = 0; i < k; i += 1) {
    const ys2 = f(i);
    const { length: l } = ys2;
    for (let j = 0; j < l; j += 1) {
      ys1[c] = ys2[j];
      c += 1;
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
      ys[l] = x;
      l += 1;
    }
  }
  return ys;
};

/** @type {<X>(xs: X[], f: (x: X) => boolean) => X[]} */
export const filter = (xs1, f) => {
  const xs2 = [];
  let l2 = 0;
  const { length: l1 } = xs1;
  for (let i = 0; i < l1; i += 1) {
    const x = xs1[i];
    if (f(x)) {
      xs2[l2] = x;
      l2 += 1;
    }
  }
  return xs2;
};

export const filterNarrow =
  /** @type {<X, Y extends X>(xs: X[], f: (x: X) => x is Y) => Y[]} */ (filter);

/** @type {<X>(xs1: X[], f: (x: X) => boolean) => X[]} */
export const filterOut = (xs1, f) => {
  const xs2 = [];
  let l2 = 0;
  const { length: l1 } = xs1;
  for (let i = 0; i < l1; i += 1) {
    const x = xs1[i];
    if (!f(x)) {
      xs2[l2] = x;
      l2 += 1;
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
  for (let i = 0; i < l; i += 1) {
    y = f(y, xs[i]);
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
  for (let i = 0; i < l; i += 1) {
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
  for (let i = 0; i < l; i += 1) {
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
export const zip = (xs, ys) => {
  const l = min(xs.length, ys.length);
  /** @type {[X, Y][]} */
  const ps = new Array(l);
  for (let i = 0; i < l; i += 1) {
    ps[i] = [xs[i], ys[i]];
  }
  return ps;
};

/**
 * @template X
 * @param {X[]} xs
 * @return {[X, boolean][]}
 */
export const zipLast = (xs) => {
  const l = xs.length;
  /** @type {[X, boolean][]} */
  const ys = new Array(l);
  for (let i = 0; i < l; i += 1) {
    ys[i] = [xs[i], i === l - 1];
  }
  return ys;
};

/**
 * @template X
 * @template Y
 * @param {(length: number) => Y[]} enumerate
 * @param {X[]} xs
 * @return {[X, Y][]}
 */
export const zipEnum = (xs, enumerate) => {
  const { length: l } = xs;
  const ys = enumerate(l);
  /** @type {[X, Y][]} */
  const ps = new Array(l);
  for (let i = 0; i < l; i += 1) {
    ps[i] = [xs[i], ys[i]];
  }
  return ps;
};

/**
 * @template X
 * @template Y
 * @param {[X, Y][]} ps
 * @return {[X[], Y[]]}
 */
export const unzip = (ps) => {
  const { length: l } = ps;
  /** @type {X[]} */
  const xs = [];
  /** @type {Y[]} */
  const ys = [];
  for (let i = 0; i < l; i += 1) {
    xs[i] = ps[i][0];
    ys[i] = ps[i][1];
  }
  return [xs, ys];
};

/////////////////
// Side Effect //
/////////////////

// /** @type {<X>(xs: X[], f: (x: X) => void) => void} */
// export const forEach = (xs, f) => {
//   for (let i = 0; i < xs.length; i += 1) {
//     f(xs[i]);
//   }
// };

// /** @type {<X>(xs: X[], x: X) => void} */
// export const push = (xs, x) => {
//   xs[xs.length] = x;
// };

// /** @type {<X>(xs1: X[], xs2: X[]) => void} */
// export const pushAll = (xs1, xs2) => {
//   let { length: l1 } = xs1;
//   const { length: l2 } = xs2;
//   for (let i2 = 0; i2 < l2; i2 += 1) {
//     xs1[l1] = xs2[i2];
//     l1 += 1;
//   }
// };

// /** @type {<X>(xs: X[]) => X} */
// export const pop = (xs) => {
//   const x = xs[xs.length - 1];
//   xs.length -= 1;
//   return x;
// };

// /** @type {<X>(xs: X[]) => X} */
// export const shift = (xs) => {
//   const { length: l } = xs;
//   const x = xs[0];
//   for (let i = 0; i < l - 1; i += 1) {
//     xs[i] = xs[i + 1];
//   }
//   xs.length -= 1;
//   return x;
// };

// /** @type {<X>(xs: X[], x: X) => void} */
// export const unshift = (xs, x) => {
//   const { length: l } = xs;
//   for (let i = l; i > 0; i -= 1) {
//     xs[i] = xs[i - 1];
//   }
//   xs[0] = x;
// };

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
    for (let i1 = 0; i1 < l1; i1 += 1) {
      xs[i1] = xs1[i1];
    }
    for (let i2 = 0; i2 < l2; i2 += 1) {
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
    for (let i2 = 0; i2 < l2; i2 += 1) {
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
    for (let i1 = 0; i1 < l1; i1 += 1) {
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
export const concat___ = (x1, x2) => [x1, x2];

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
    for (let i2 = 0; i2 < l2; i2 += 1) {
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
    for (let i2 = 0; i2 < l2; i2 += 1) {
      xs[i2 + 1] = xs2[i2];
    }
    for (let i3 = 0; i3 < l3; i3 += 1) {
      xs[i3 + 1 + l2] = xs3[i3];
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
  if (l2 === 0 && l3 === 0) {
    return xs1;
  } else if (l1 === 0 && l3 === 0) {
    return xs2;
  } else if (l1 === 0 && l2 === 0) {
    return xs3;
  } else {
    const xs = new Array(l1 + l2 + l3);
    for (let i1 = 0; i1 < l1; i1 += 1) {
      xs[i1] = xs1[i1];
    }
    for (let i2 = 0; i2 < l2; i2 += 1) {
      xs[i2 + l1] = xs2[i2];
    }
    for (let i3 = 0; i3 < l3; i3 += 1) {
      xs[i3 + l1 + l2] = xs3[i3];
    }
    return xs;
  }
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
    for (let i1 = 0; i1 < l1; i1 += 1) {
      xs[i1] = xs1[i1];
    }
    for (let i2 = 0; i2 < l2; i2 += 1) {
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
    for (let i1 = 0; i1 < l1; i1 += 1) {
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
    for (let i3 = 0; i3 < l3; i3 += 1) {
      xs[i3 + 2] = xs3[i3];
    }
    return xs;
  }
};

// 4 //

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
  for (let i2 = 0; i2 < l2; i2 += 1) {
    xs[i2 + 1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3 += 1) {
    xs[i3 + 1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4 += 1) {
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
  const xs = new Array(l1 + l2 + l3 + l4);
  for (let i1 = 0; i1 < l1; i1 += 1) {
    xs[i1] = xs1[i1];
  }
  for (let i2 = 0; i2 < l2; i2 += 1) {
    xs[i2 + l1] = xs2[i2];
  }
  for (let i3 = 0; i3 < l3; i3 += 1) {
    xs[i3 + l1 + l2] = xs3[i3];
  }
  for (let i4 = 0; i4 < l4; i4 += 1) {
    xs[i4 + l1 + l2 + l3] = xs4[i4];
  }
  return xs;
};

// 5 //

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
    for (let i5 = 0; i5 < l5; i5 += 1) {
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
    for (let i4 = 0; i4 < l4; i4 += 1) {
      xs[i4 + 3] = xs4[i4];
    }
    for (let i5 = 0; i5 < l5; i5 += 1) {
      xs[i5 + 3 + l4] = xs5[i5];
    }
    return xs;
  }
};
