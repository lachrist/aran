const {Error} = globalThis;

////////////
// Assert //
////////////

/* eslint-disable no-restricted-syntax */
class AssertionError extends Error {
  get name() {
    return "AssertionError";
  }
}
/* eslint-enable no-restricted-syntax */

export const assert = (check, message) => {
  if (!check) {
    throw new AssertionError(message);
  }
};

//////////////
// deadcode //
//////////////

/* eslint-disable no-restricted-syntax */
class DeadcodeError extends Error {
  get name() {
    return "DeadcodeError";
  }
}
/* eslint-enable no-restricted-syntax */

export const deadcode = (message) => () => {
  throw new DeadcodeError(message);
};
export const deadcode_ = (message) => (_x1) => {
  throw new DeadcodeError(message);
};
export const deadcode__ = (message) => (_x1, _x2) => {
  throw new DeadcodeError(message);
};
export const deadcode___ = (message) => (_x1, _x2, _x3) => {
  throw new DeadcodeError(message);
};
export const deadcode____ = (message) => (_x1, _x2, _x3, _x4) => {
  throw new DeadcodeError(message);
};

//////////////
// Constant //
//////////////

export const constant = (x) => () => x;
export const constant_ = (x) => (_y1) => x;
export const constant__ = (x) => (_y1, _y2) => x;
export const constant___ = (x) => (_y1, _y2, _y3) => x;
export const constant____ = (x) => (_y1, _y2, _y3, _y4) => x;

//////////
// Flip //
//////////

export const flipxx = (f) => (x2, x1) => f(x1, x2);
export const flip_xx = (f) => (x1, x3, x2) => f(x1, x2, x3);
export const flipx_x = (f) => (x3, x2, x1) => f(x1, x2, x3);
export const flipxx_ = (f) => (x2, x1, x3) => f(x1, x2, x3);

////////////
// Return //
////////////

export const returnx = (x1) => x1;
export const returnx_ = (x1, _x2) => x1;
export const return_x = (_x1, x2) => x2;
export const returnx__ = (x1, _x2, _x3) => x1;
export const return_x_ = (_x1, x2, _x3) => x2;
export const return__x = (_x1, _x2, x3) => x3;
export const returnx___ = (x1, _x2, _x3, _x4) => x1;
export const return_x__ = (_x1, x2, _x3, _x4) => x2;
export const return__x_ = (_x1, _x2, x3, _x4) => x3;
export const return___x = (_x1, _x2, _x3, x4) => x4;

/////////////
// Partial //
/////////////

export const partial_ = (f) => (x1) => f(x1);
export const partialx = (f, x1) => () => f(x1);

export const partial__ = (f) => (x1, x2) => f(x1, x2);
export const partialx_ = (f, x1) => (x2) => f(x1, x2);
export const partial_x = (f, x2) => (x1) => f(x1, x2);
export const partialxx = (f, x1, x2) => () => f(x1, x2);

export const partial___ = (f) => (x1, x2, x3) => f(x1, x2, x3);
export const partialx__ = (f, x1) => (x2, x3) => f(x1, x2, x3);
export const partial_x_ = (f, x2) => (x1, x3) => f(x1, x2, x3);
export const partial__x = (f, x3) => (x1, x2) => f(x1, x2, x3);
export const partialxx_ = (f, x1, x2) => (x3) => f(x1, x2, x3);
export const partialx_x = (f, x1, x3) => (x2) => f(x1, x2, x3);
export const partial_xx = (f, x2, x3) => (x1) => f(x1, x2, x3);
export const partialxxx = (f, x1, x2, x3) => () => f(x1, x2, x3);

export const partial____ = (f) => (x1, x2, x3, x4) => f(x1, x2, x3, x4);
export const partialx___ = (f, x1) => (x2, x3, x4) => f(x1, x2, x3, x4);
export const partial_x__ = (f, x2) => (x1, x3, x4) => f(x1, x2, x3, x4);
export const partial__x_ = (f, x3) => (x1, x2, x4) => f(x1, x2, x3, x4);
export const partial___x = (f, x4) => (x1, x2, x3) => f(x1, x2, x3, x4);
export const partialxx__ = (f, x1, x2) => (x3, x4) => f(x1, x2, x3, x4);
export const partialx_x_ = (f, x1, x3) => (x2, x4) => f(x1, x2, x3, x4);
export const partialx__x = (f, x1, x4) => (x2, x3) => f(x1, x2, x3, x4);
export const partial_xx_ = (f, x2, x3) => (x1, x4) => f(x1, x2, x3, x4);
export const partial_x_x = (f, x2, x4) => (x1, x3) => f(x1, x2, x3, x4);
export const partial__xx = (f, x3, x4) => (x1, x2) => f(x1, x2, x3, x4);
export const partialxxx_ = (f, x1, x2, x3) => (x4) => f(x1, x2, x3, x4);
export const partialxx_x = (f, x1, x2, x4) => (x3) => f(x1, x2, x3, x4);
export const partialx_xx = (f, x1, x3, x4) => (x2) => f(x1, x2, x3, x4);
export const partial_xxx = (f, x2, x3, x4) => (x1) => f(x1, x2, x3, x4);
export const partialxxxx = (f, x1, x2, x3, x4) => () => f(x1, x2, x3, x4);

export const partialx____ = (f, x1) => (x2, x3, x4, x5) =>
  f(x1, x2, x3, x4, x5);
export const partialxx___ = (f, x1, x2) => (x3, x4, x5) =>
  f(x1, x2, x3, x4, x5);
export const partial_xxx_ = (f, x2, x3, x4) => (x1, x5) =>
  f(x1, x2, x3, x4, x5);

export const partialxx____ = (f, x1, x2) => (x3, x4, x5, x6) =>
  f(x1, x2, x3, x4, x5, x6);

export const partialxx_x_x_x__ =
  (f, x1, x2, x4, x6, x8) => (x3, x5, x7, x9, x10) =>
    f(x1, x2, x3, x4, x5, x6, x7, x8, x9, x10);

// export const dropFirst =
//   (f) =>
//   (_x, ...xs) =>
//     apply(f, undefined, xs);

// export const bind =
//   (f, g) =>
//   (...xs) =>
//     f(apply(g, undefined, xs));
// export const bind0 = (f, g) => () => f(g());
// export const bind1 = (f, g) => (x1) => f(g(x1));
// export const bind2 = (f, g) => (x1, x2) => f(g(x1, x2));
// export const bind3 = (f, g) => (x1, x2, x3) => f(g(x1, x2, x3));
// export const bind4 = (f, g) => (x1, x2, x3, x4) => f(g(x1, x2, x3, x4));
// export const bind5 = (f, g) => (x1, x2, x3, x4, x5) => f(g(x1, x2, x3, x4, x5));

// export const PARTIAL = Symbol("partial");
//
// export const partial =
//   (f, ...xs) =>
//   (...ys) => {
//     const zs = [];
//     const length1 = xs.length;
//     const length2 = ys.length;
//     let index2 = 0;
//     for (let index1 = 0; index1 < length1; index1 += 1) {
//       if (xs[index1] === PARTIAL) {
//         assert(index2 < length2, "missing secondary arguments");
//         zs[index1] = ys[index2];
//         index2 += 1;
//       } else {
//         zs[index1] = xs[index1];
//       }
//     }
//     assert(index2 === length2, "too many secondary arguments");
//     return apply(f, undefined, zs);
//   };