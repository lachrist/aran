const {
  Array,
  Array: { from: toArray },
  Set,
} = globalThis;

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

/** @type {<X> (xs: X[]) => X[]} */
export const removeDuplicate = (xs) => toArray(new Set(xs));

/** @type {<X> (xs1: X[], i: number, j: number) => X[]} */
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

/** @type {<X> (xss: X[][]) => X[]} */
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

/** @type {<X> (xs: X[]) => X} */
export const getLast = (xs) => xs[xs.length - 1];

/** @type {<X> (xs: X[], x: X) => boolean} */
export const includes = (xs, x) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i += 1) {
    if (xs[i] === x) {
      return true;
    }
  }
  return false;
};

/** @type {<X> (xs: X[], f: (x: X) => boolean) => boolean} */
export const some = (xs, f) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i += 1) {
    if (f(xs[i])) {
      return true;
    }
  }
  return false;
};

/** @type {<X> (xs: X[], f: (x: X) => boolean) => boolean} */
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

/** @type {<X> (xs: X[], f: (x: X) => boolean) => X[]} */
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

/** @type {<X> (xs1: X[], f: (x: X) => boolean) => X[]} */
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

/** @type {<X> (xs: X[], f: (x: X) => boolean) => number} */
export const indexOf = (xs, x) => {
  const { length: l } = xs;
  for (let i = 0; i < l; i += 1) {
    if (xs[i] === x) {
      return i;
    }
  }
  return -1;
};

/** @type {<X> (xs: X[], f: (x: X) => boolean) => number} */
export const lastIndexOf = (xs, x) => {
  for (let i = xs.length - 1; i >= 0; i -= 1) {
    if (xs[i] === x) {
      return i;
    }
  }
  return -1;
};

/////////////////
// Side Effect //
/////////////////

/** @type {<X> (xs: X[], f: (x: X) => void) => void} */
export const forEach = (xs, f) => {
  for (let i = 0; i < xs.length; i += 1) {
    f(xs[i]);
  }
};

/** @type {<X> (xs: X[], x: X) => void} */
export const push = (xs, x) => {
  xs[xs.length] = x;
};

/** @type {<X> (xs1: X[], xs2: X[]) => void} */
export const pushAll = (xs1, xs2) => {
  let { length: l1 } = xs1;
  const { length: l2 } = xs2;
  for (let i2 = 0; i2 < l2; i2 += 1) {
    xs1[l1] = xs2[i2];
    l1 += 1;
  }
};

/** @type {<X> (xs: X[]) => X} */
export const pop = (xs) => {
  const x = xs[xs.length - 1];
  xs.length -= 1;
  return x;
};

/** @type {<X> (xs: X[]) => X} */
export const shift = (xs) => {
  const { length: l } = xs;
  const x = xs[0];
  for (let i = 0; i < l - 1; i += 1) {
    xs[i] = xs[i + 1];
  }
  xs.length -= 1;
  return x;
};

/** @type {<X> (xs: X[], x: X) => void} */
export const unshift = (xs, x) => {
  const { length: l } = xs;
  for (let i = l; i > 0; i -= 1) {
    xs[i] = xs[i - 1];
  }
  xs[0] = x;
};

////////////
// Concat //
////////////

/** @type {<X> (xs1: X[], xs2: X[]) => X[]} */
export const concat$$ = (xs1, xs2) => {
  const xs = [];
  let l = 0;
  const { length: l1 } = xs1;
  for (let i1 = 0; i1 < l1; i1 += 1) {
    xs[l] = xs1[i1];
    l += 1;
  }
  const { length: l2 } = xs2;
  for (let i2 = 0; i2 < l2; i2 += 1) {
    xs[l] = xs2[i2];
    l += 1;
  }
  return xs;
};

/** @type {<X> (x1: X, xs2: X[]) => X[]} */
export const concat_$ = (x1, xs2) => {
  const xs = [x1];
  const { length: l2 } = xs2;
  for (let i2 = 0; i2 < l2; i2 += 1) {
    xs[i2 + 1] = xs2[i2];
  }
  return xs;
};

/** @type {<X> (xs1: X[], x2: X) => X[]} */
export const concat$_ = (xs1, x2) => {
  const xs = [];
  const { length: l1 } = xs1;
  for (let i1 = 0; i1 < l1; i1 += 1) {
    xs[i1] = xs1[i1];
  }
  xs[l1] = x2;
  return xs;
};

/** @type {<X> (x1: X, x2: X) => X[]} */
export const concat__ = (x1, x2) => [x1, x2];

/** @type {<X> (x1: X, xs2: X[], x3: X) => X[]} */
export const concat_$_ = (x1, xs2, x3) => {
  const xs = [x1];
  const { length: l2 } = xs2;
  for (let i2 = 0; i2 < l2; i2 += 1) {
    xs[i2 + 1] = xs2[i2];
  }
  xs[l2 + 1] = x3;
  return xs;
};
