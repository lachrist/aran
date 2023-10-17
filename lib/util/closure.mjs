//////////
// noop //
//////////

/** @type {() => void} */
export const noop = () => {};

/** @type {(x0: unknown) => void} */
export const noop_ = (_x0) => {};

/** @type {(x0: unknown, x1:unknown) => void} */
export const noop__ = (_x0, _x1) => {};

/** @type {(x0: unknown, x1:unknown, x2:unknown) => void} */
export const noop___ = (_x0, _x1, _x2) => {};

/** @type {(x0: unknown, x1:unknown, x2:unknown, x3:unknown) => void} */
export const noop____ = (_x0, _x1, _x2, _x3) => {};

/** @type {(x0: unknown, x1:unknown, x2:unknown, x3:unknown, x4: unknown) => void} */
export const noop_____ = (_x0, _x1, _x2, _x3, _x4) => {};

/** @type {(x0: unknown, x1:unknown, x2:unknown, x3:unknown, x4:unknown, x5:unknown) => void} */
export const noop______ = (_x0, _x1, _x2, _x3, _x4, _x5) => {};

//////////////
// Constant //
//////////////

/**
 * @template X
 * @type {(x: X) => () => X}
 */
export const constant = (x) => () => x;

/**
 * @template X, Y1
 * @type {(x: X) => (y1: Y1) => X}
 */
export const constant_ = (x) => (_y1) => x;

/**
 * @template X, Y1, Y2
 * @type {(x: X) => (y1: Y1, y2: Y2) => X}
 */
export const constant__ = (x) => (_y1, _y2) => x;

/**
 * @template X, Y1, Y2, Y3
 * @type {(x: X) => (y1: Y1, y2: Y2, y3:Y3) => X}
 */
export const constant___ = (x) => (_y1, _y2, _y3) => x;

/**
 * @template X, Y1, Y2, Y3, Y4
 * @type {(x: X) => (y1: Y1, y2: Y2, y3:Y3, y4:Y4) => X}
 */
export const constant____ = (x) => (_y1, _y2, _y3, _y4) => x;

/**
 * @template X, Y1, Y2, Y3, Y4, Y5
 * @type {(x: X) => (y1: Y1, y2: Y2, y3:Y3, y4:Y4, y5:Y5) => X}
 */
export const constant_____ = (x) => (_y1, _y2, _y3, _y4, _y5) => x;

/**
 * @template X, Y1, Y2, Y3, Y4, Y5, Y6
 * @type {(x: X) => (y1: Y1, y2: Y2, y3: Y3, y4: Y4, y5: Y5, y6: Y6) => X}
 */
export const constant______ = (x) => (_y1, _y2, _y3, _y4, _y5, _y6) => x;

/**
 * @template X, Y1, Y2, Y3, Y4, Y5, Y6, Y7
 * @type {(x: X) => (y1: Y1, y2: Y2, y3: Y3, y4: Y4, y5: Y5, y6: Y6, y7: Y7) => X}
 */
export const constant_______ = (x) => (_y1, _y2, _y3, _y4, _y5, _y6, _y7) => x;

//////////
// Flip //
//////////

/**
 * @template X1, X2, Y
 * @type {(f: (x1:X1, x2:X2) => Y) => ((x2:X2, x1:X1) => Y)}
 */
export const flip$$ = (f) => (x2, x1) => f(x1, x2);

/**
 * @template X1, X2, X3, Y
 * @type {(f: (x1:X1, x2:X2, x3:X3) => Y) => ((x1:X1, x3:X3, x2:X2) => Y)}
 */
export const flip_$$ = (f) => (x1, x3, x2) => f(x1, x2, x3);

/**
 * @template X1, X2, X3, Y
 * @type {(f: (x1:X1, x2:X2, x3:X3) => Y) => ((x3:X3, x2:X2, x1:X1) => Y)}
 */
export const flip$_$ = (f) => (x3, x2, x1) => f(x1, x2, x3);

/**
 * @template X1, X2, X3, Y
 * @type {(f: (x1:X1, x2:X2, x3:X3) => Y) => ((x2:X2, x1:X1, x3:X3) => Y)}
 */
export const flip$$_ = (f) => (x2, x1, x3) => f(x1, x2, x3);

////////////
// Return //
////////////

/**
 * @template X1
 * @type {(x1: X1) => X1}
 */
export const return$ = (x1) => x1;

/**
 * @template X1, X2
 * @type {(x1: X1, x2: X2) => X1}
 */
export const return$_ = (x1, _x2) => x1;

/**
 * @template X1, X2
 * @type {(x1: X1, x2: X2) => X2}
 */
export const return_$ = (_x1, x2) => x2;

/**
 * @template X1, X2, X3
 * @type {(x1: X1, x2: X2, x3: X3) => X1}
 */
export const return$__ = (x1, _x2, _x3) => x1;

/**
 * @template X1, X2, X3
 * @type {(x1: X1, x2: X2, x3: X3) => X2}
 */
export const return_$_ = (_x1, x2, _x3) => x2;

/**
 * @template X1, X2, X3
 * @type {(x1: X1, x2: X2, x3: X3) => X3}
 */
export const return__$ = (_x1, _x2, x3) => x3;

/**
 * @template X1, X2, X3, X4
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4) => X1}
 */
export const return$___ = (x1, _x2, _x3, _x4) => x1;

/**
 * @template X1, X2, X3, X4
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4) => X2}
 */
export const return_$__ = (_x1, x2, _x3, _x4) => x2;

/**
 * @template X1, X2, X3, X4
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4) => X3}
 */
export const return__$_ = (_x1, _x2, x3, _x4) => x3;

/**
 * @template X1, X2, X3, X4
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4) => X4}
 */
export const return___$ = (_x1, _x2, _x3, x4) => x4;

/**
 * @template X1, X2, X3, X4, X5
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5) => X1}
 */
export const return$____ = (x1, _x2, _x3, _x4, _x5) => x1;

/**
 * @template X1, X2, X3, X4, X5
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5) => X2}
 */
export const return_$___ = (_x1, x2, _x3, _x4, _x5) => x2;

/**
 * @template X1, X2, X3, X4, X5
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5) => X3}
 */
export const return__$__ = (_x1, _x2, x3, _x4, _x5) => x3;

/**
 * @template X1, X2, X3, X4, X5
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5) => X4}
 */
export const return___$_ = (_x1, _x2, _x3, x4, _x5) => x4;

/**
 * @template X1, X2, X3, X4, X5
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5) => X5}
 */
export const return____$ = (_x1, _x2, _x3, _x4, x5) => x5;

/**
 * @template X1, X2, X3, X4, X5, X6
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5, x6: X6) => X1}
 */
export const return$_____ = (x1, _x2, _x3, _x4, _x5, _x6) => x1;

/**
 * @template X1, X2, X3, X4, X5, X6
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5, x6: X6) => X2}
 */
export const return_$____ = (_x1, x2, _x3, _x4, _x5, _x6) => x2;

/**
 * @template X1, X2, X3, X4, X5, X6
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5, x6: X6) => X3}
 */
export const return__$___ = (_x1, _x2, x3, _x4, _x5, _x6) => x3;

/**
 * @template X1, X2, X3, X4, X5, X6
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5, x6: X6) => X4}
 */
export const return___$__ = (_x1, _x2, _x3, x4, _x5, _x6) => x4;

/**
 * @template X1, X2, X3, X4, X5, X6
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5, x6: X6) => X5}
 */
export const return____$_ = (_x1, _x2, _x3, _x4, x5, _x6) => x5;

/**
 * @template X1, X2, X3, X4, X5, X6
 * @type {(x1: X1, x2: X2, x3: X3, x4: X4, x5: X5, x6: X6) => X6}
 */
export const return_____$ = (_x1, _x2, _x3, _x4, _x5, x6) => x6;

//////////
// Drop //
//////////

// export const drop_ = (f) => (x1) => f(x1);
// export const dropx = (f) => (_x1) => f();

// export const drop__ = (f) => (x1, x2) => f(x1, x2);
// export const dropx_ = (f) => (_x1, x2) => f(x2);
// export const drop_x = (f) => (x1, _x2) => f(x1);
// export const dropxx = (f) => (_x1, _x2) => f();

// export const drop___ = (f) => (x1, x2, x3) => f(x1, x2, x3);
// export const dropx__ = (f) => (_x1, x2, x3) => f(x2, x3);
// export const drop_x_ = (f) => (x1, _x2, x3) => f(x1, x3);
// export const drop__x = (f) => (x1, x2, _x3) => f(x1, x2);
// export const drop_xx = (f) => (x1, _x2, _x3) => f(x1);
// export const dropx_x = (f) => (_x1, x2, _x3) => f(x2);
// export const dropxx_ = (f) => (_x1, _x2, x3) => f(x3);
// export const dropxxx = (f) => (_x1, _x2, _x3) => f();

// export const drop_xxx = (f) => (x1, _x2, _x3, _x4) => f(x1);
// export const drop___x = (f) => (x1, x2, x3, _x4) => f(x1, x2, x3);
// export const dropx__x = (f) => (_x1, x2, x3, _x4) => f(x2, x3);
// export const dropxxx_ = (f) => (_x1, _x2, _x3, x4) => f(x4);

// export const drop_xxxx = (f) => (x1, _x2, _x3, _x4, _x5) => f(x1);
// export const dropxxx_x = (f) => (_x1, _x2, _x3, x4, _x5) => f(x4);

// export const dropxxxx_x = (f) => (_x1, _x2, _x3, _x4, x5, _x6) => f(x5);
// export const dropx__x__ = (f) => (_x1, x2, x3, _x4, x5, x6) =>
//   f(x2, x3, x5, x6);
// export const dropx_x___ = (f) => (_x1, x2, _x3, x4, x5, x6) =>
//   f(x2, x4, x5, x6);

// export const drop_____xx = (f) => (x1, x2, x3, x4, x5, _x6, _x7) =>
//   f(x1, x2, x3, x4, x5);
// export const dropxxxxx_x = (f) => (_x1, _x2, _x3, _x4, _x5, x6, _x7) => f(x6);

//////////
// Bind //
//////////

// export const bind = (f, g) => () => f(g());
// export const bind_ = (f, g) => (x1) => f(g(x1));
// export const bind__ = (f, g) => (x1, x2) => f(g(x1, x2));
// export const bind___ = (f, g) => (x1, x2, x3) => f(g(x1, x2, x3));
// export const bind____ = (f, g) => (x1, x2, x3, x4) => f(g(x1, x2, x3, x4));
// export const bind_____ = (f, g) => (x1, x2, x3, x4, x5) =>
//   f(g(x1, x2, x3, x4, x5));
// export const bind______ = (f, g) => (x1, x2, x3, x4, x5, x6) =>
//   f(g(x1, x2, x3, x4, x5, x6));

/////////////
// Partial //
/////////////

/**
 * @template X1, Y
 * @type {(f: (x1: X1) => Y) => (x1: X1) => Y}
 */
export const partial_ = (f) => (x1) => f(x1);

/**
 * @template X1, Y
 * @type {(f: (x1: X1) => Y, x1: X1) => () => Y}
 */
export const partial$ = (f, x1) => () => f(x1);

/**
 * @template X1, X2, Y
 * @type {(f: (x1: X1, x2: X2) => Y) => (x1: X1, x2: X2) => Y}
 */
export const partial__ = (f) => (x1, x2) => f(x1, x2);

/**
 * @template X1, X2, Y
 * @type {(f: (x1: X1, x2: X2) => Y, x1: X1) => (x2: X2) => Y}
 */
export const partial$_ = (f, x1) => (x2) => f(x1, x2);

/**
 * @template X1, X2, Y
 * @type {(f: (x1: X1, x2: X2) => Y, x2: X2) => (x1: X1) => Y}
 */
export const partial_$ = (f, x2) => (x1) => f(x1, x2);

/**
 * @template X1, X2, Y
 * @type {(f: (x1: X1, x2: X2) => Y, x1: X1, x2: X2) => () => Y}
 */
export const partial$$ = (f, x1, x2) => () => f(x1, x2);

// export const partial___ = (f) => (x1, x2, x3) => f(x1, x2, x3);
// export const partialx__ = (f, x1) => (x2, x3) => f(x1, x2, x3);
// export const partial_x_ = (f, x2) => (x1, x3) => f(x1, x2, x3);
// export const partial__x = (f, x3) => (x1, x2) => f(x1, x2, x3);
// export const partialxx_ = (f, x1, x2) => (x3) => f(x1, x2, x3);
// export const partialx_x = (f, x1, x3) => (x2) => f(x1, x2, x3);
// export const partial_xx = (f, x2, x3) => (x1) => f(x1, x2, x3);
// export const partialxxx = (f, x1, x2, x3) => () => f(x1, x2, x3);

// export const partial____ = (f) => (x1, x2, x3, x4) => f(x1, x2, x3, x4);
// export const partialx___ = (f, x1) => (x2, x3, x4) => f(x1, x2, x3, x4);
// export const partial_x__ = (f, x2) => (x1, x3, x4) => f(x1, x2, x3, x4);
// export const partial__x_ = (f, x3) => (x1, x2, x4) => f(x1, x2, x3, x4);
// export const partial___x = (f, x4) => (x1, x2, x3) => f(x1, x2, x3, x4);
// export const partialxx__ = (f, x1, x2) => (x3, x4) => f(x1, x2, x3, x4);
// export const partialx_x_ = (f, x1, x3) => (x2, x4) => f(x1, x2, x3, x4);
// export const partialx__x = (f, x1, x4) => (x2, x3) => f(x1, x2, x3, x4);
// export const partial_xx_ = (f, x2, x3) => (x1, x4) => f(x1, x2, x3, x4);
// export const partial_x_x = (f, x2, x4) => (x1, x3) => f(x1, x2, x3, x4);
// export const partial__xx = (f, x3, x4) => (x1, x2) => f(x1, x2, x3, x4);
// export const partialxxx_ = (f, x1, x2, x3) => (x4) => f(x1, x2, x3, x4);
// export const partialxx_x = (f, x1, x2, x4) => (x3) => f(x1, x2, x3, x4);
// export const partialx_xx = (f, x1, x3, x4) => (x2) => f(x1, x2, x3, x4);
// export const partial_xxx = (f, x2, x3, x4) => (x1) => f(x1, x2, x3, x4);
// export const partialxxxx = (f, x1, x2, x3, x4) => () => f(x1, x2, x3, x4);

// export const partialxxx_x = (f, x1, x2, x3, x5) => (x4) =>
//   f(x1, x2, x3, x4, x5);
// export const partialx_xxx = (f, x1, x3, x4, x5) => (x2) =>
//   f(x1, x2, x3, x4, x5);
// export const partial__x_x = (f, x3, x5) => (x1, x2, x4) =>
//   f(x1, x2, x3, x4, x5);
// export const partial_xx_x = (f, x2, x3, x5) => (x1, x4) =>
//   f(x1, x2, x3, x4, x5);
// export const partial_xx__ = (f, x2, x3) => (x1, x4, x5) =>
//   f(x1, x2, x3, x4, x5);
// export const partial__x__ = (f, x3) => (x1, x2, x4, x5) =>
//   f(x1, x2, x3, x4, x5);
// export const partialxxx__ = (f, x1, x2, x3) => (x4, x5) =>
//   f(x1, x2, x3, x4, x5);
// export const partialx____ = (f, x1) => (x2, x3, x4, x5) =>
//   f(x1, x2, x3, x4, x5);
// export const partialxx___ = (f, x1, x2) => (x3, x4, x5) =>
//   f(x1, x2, x3, x4, x5);
// export const partial_xxx_ = (f, x2, x3, x4) => (x1, x5) =>
//   f(x1, x2, x3, x4, x5);

// export const partialx_____ = (f, x1) => (x2, x3, x4, x5, x6) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partial__xx_x = (f, x3, x4, x6) => (x1, x2, x5) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partial__x__x = (f, x3, x6) => (x1, x2, x4, x5) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partial___x__ = (f, x4) => (x1, x2, x3, x5, x6) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partial__x_x_ = (f, x3, x5) => (x1, x2, x4, x6) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partial____xx = (f, x5, x6) => (x1, x2, x3, x4) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partialxx____ = (f, x1, x2) => (x3, x4, x5, x6) =>
//   f(x1, x2, x3, x4, x5, x6);
// export const partialx_x___ = (f, x1, x3) => (x2, x4, x5, x6) =>
//   f(x1, x2, x3, x4, x5, x6);

// export const partialx_x___x = (f, x1, x3, x7) => (x2, x4, x5, x6) =>
//   f(x1, x2, x3, x4, x5, x6, x7);
// export const partialx_x____ = (f, x1, x3) => (x2, x4, x5, x6, x7) =>
//   f(x1, x2, x3, x4, x5, x6, x7);
// export const partialxxx____ = (f, x1, x2, x3) => (x4, x5, x6, x7) =>
//   f(x1, x2, x3, x4, x5, x6, x7);
// export const partialx______ = (f, x1) => (x2, x3, x4, x5, x6, x7) =>
//   f(x1, x2, x3, x4, x5, x6, x7);
// export const partialxx_____ = (f, x1, x2) => (x3, x4, x5, x6, x7) =>
//   f(x1, x2, x3, x4, x5, x6, x7);

// export const partialxx______ = (f, x1, x2) => (x3, x4, x5, x6, x7, x8) =>
//   f(x1, x2, x3, x4, x5, x6, x7, x8);
// export const partialxxx_____ = (f, x1, x2, x3) => (x4, x5, x6, x7, x8) =>
//   f(x1, x2, x3, x4, x5, x6, x7, x8);

// export const partialxxx______ = (f, x1, x2, x3) => (x4, x5, x6, x7, x8, x9) =>
//   f(x1, x2, x3, x4, x5, x6, x7, x8, x9);

// export const partialx__xx_x_x_ =
//   (f, x1, x4, x5, x7, x9) => (x2, x3, x6, x8, x10) =>
//     f(x1, x2, x3, x4, x5, x6, x7, x8, x9, x10);
// export const partialxx_x_x_x__ =
//   (f, x1, x2, x4, x6, x8) => (x3, x5, x7, x9, x10) =>
//     f(x1, x2, x3, x4, x5, x6, x7, x8, x9, x10);

// export const partialxf_ = (f, x1, f2) => (x2, x3) => f(x1, f2(x2), x3);

// export const partialxf__ = (f, x1, f2) => (x2, x3, x4) => f(x1, f2(x2), x3, x4);

// export const partialxxf__ = (f, x1, x2, f3) => (x3, x4, x5) =>
//   f(x1, x2, f3(x3), x4, x5);

// export const partialxf___ = (f, x1, f2) => (x2, x3, x4, x5) =>
//   f(x1, f2(x2), x3, x4, x5);

// export const partialxx_f__ = (f, x1, x2, f4) => (x3, x4, x5, x6) =>
//   f(x1, x2, x3, f4(x4), x5, x6);

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
