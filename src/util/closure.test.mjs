import {forEach} from "array-lite";

import {assertEqual, assertDeepEqual, assertThrow} from "../__fixture__.mjs";

import {
  assert,
  deadcode,
  deadcode_,
  deadcode__,
  deadcode___,
  deadcode____,
  constant,
  constant_,
  constant__,
  constant___,
  constant____,
  returnx,
  returnx_,
  return_x,
  returnx__,
  return_x_,
  return__x,
  returnx___,
  return_x__,
  return__x_,
  return___x,
  flipxx,
  flip_xx,
  flipx_x,
  flipxx_,
  partial_,
  partialx,
  partial__,
  partialx_,
  partial_x,
  partialxx,
  partial___,
  partialx__,
  partial_x_,
  partial__x,
  partialxx_,
  partialx_x,
  partial_xx,
  partialxxx,
  partial____,
  partialx___,
  partial_x__,
  partial__x_,
  partial___x,
  partialxx__,
  partialx_x_,
  partialx__x,
  partial_xx_,
  partial_x_x,
  partial__xx,
  partialxxx_,
  partialxx_x,
  partialx_xx,
  partial_xxx,
  partialxxxx,
  partialx____,
  partialxx___,
  partial_xxx_,
  partialxx____,
  partialxx_x_x_x__,
} from "./closure.mjs";

const {
  Array,
  Reflect: {apply},
  undefined,
} = globalThis;

// const concatTwice = (xs) => concat(xs, xs);

// const generateReturnArguments = (length) => {
//   const f = (...xs) => xs;
//   defineProperty(f, "length", {value: length});
//   return f;
// };

const returnArguments = (...xs) => xs;

// assertDeepEqual(flip(generateReturnArguments(0))(0), []);
// assertDeepEqual(flip(generateReturnArguments(1))(1), [undefined]);
// assertDeepEqual(flip(generateReturnArguments(2))(1, 2), [2, 1]);
// assertDeepEqual(flip(generateReturnArguments(3))(1, 2, 3), [2, 1, 3]);
// assertDeepEqual(flip(generateReturnArguments(4))(1, 2, 3, 4), [2, 1, 3, 4]);
// assertDeepEqual(
//   flip(generateReturnArguments(5))(1, 2, 3, 4, 5),
//   [2, 1, 3, 4, 5],
// );
// assertThrow(() => flip(generateReturnArguments(6)));

// assertDeepEqual(bind0(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6), []);
// assertDeepEqual(bind1(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6), [1, 1]);
// assertDeepEqual(
//   bind2(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6),
//   [1, 2, 1, 2],
// );
// assertDeepEqual(
//   bind3(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 1, 2, 3],
// );
// assertDeepEqual(
//   bind4(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 4, 1, 2, 3, 4],
// );
// assertDeepEqual(
//   bind5(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
// );
// assertDeepEqual(
//   bind(concatTwice, returnArguments)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6],
// );

assertEqual(assert(true, "foo"), undefined);

assertThrow(() => assert(false, "foo"), {
  name: "AssertionError",
  message: "foo",
});

forEach(
  [
    [deadcode, 0],
    [deadcode_, 1],
    [deadcode__, 2],
    [deadcode___, 3],
    [deadcode____, 4],
  ],
  ([generate, length]) => {
    assertThrow(() => apply(generate("foo"), undefined, Array(length)), {
      name: "DeadcodeError",
      message: "foo",
    });
  },
);

forEach(
  [
    [constant, 0],
    [constant_, 1],
    [constant__, 2],
    [constant___, 3],
    [constant____, 4],
  ],
  ([generate, length]) => {
    assertEqual(apply(generate("foo"), undefined, Array(length)), "foo");
  },
);

forEach(
  [
    [returnx, 1, 0],
    [returnx_, 2, 0],
    [return_x, 2, 1],
    [returnx__, 3, 0],
    [return_x_, 3, 1],
    [return__x, 3, 2],
    [returnx___, 4, 0],
    [return_x__, 4, 1],
    [return__x_, 4, 2],
    [return___x, 4, 3],
  ],
  ([success, length, index]) => {
    const args = Array(length);
    args[index] = "foo";
    assertEqual(apply(success, undefined, args), "foo");
  },
);

forEach(
  [
    [flipxx, [1, 0]],
    [flip_xx, [0, 2, 1]],
    [flipx_x, [2, 1, 0]],
    [flipxx_, [1, 0, 2]],
  ],
  ([flip, xs]) => {
    const ys = [];
    for (let index = 0; index < xs.length; index += 1) {
      ys[index] = index;
    }
    assertDeepEqual(apply(flip(returnArguments), undefined, xs), ys);
  },
);

forEach(
  [
    [partial_, [false]],
    [partialx, [true]],
    [partial__, [false, false]],
    [partialx_, [true, false]],
    [partial_x, [false, true]],
    [partialxx, [true, true]],
    [partial___, [false, false, false]],
    [partialx__, [true, false, false]],
    [partial_x_, [false, true, false]],
    [partial__x, [false, false, true]],
    [partialxx_, [true, true, false]],
    [partialx_x, [true, false, true]],
    [partial_xx, [false, true, true]],
    [partialxxx, [true, true, true]],
    [partial____, [false, false, false, false]],
    [partialx___, [true, false, false, false]],
    [partial_x__, [false, true, false, false]],
    [partial__x_, [false, false, true, false]],
    [partial___x, [false, false, false, true]],
    [partialxx__, [true, true, false, false]],
    [partialx_x_, [true, false, true, false]],
    [partialx__x, [true, false, false, true]],
    [partial_xx_, [false, true, true, false]],
    [partial_x_x, [false, true, false, true]],
    [partial__xx, [false, false, true, true]],
    [partialxxx_, [true, true, true, false]],
    [partialxx_x, [true, true, false, true]],
    [partialx_xx, [true, false, true, true]],
    [partial_xxx, [false, true, true, true]],
    [partialxxxx, [true, true, true, true]],
    [partialx____, [true, false, false, false, false]],
    [partialxx___, [true, true, false, false, false]],
    [partial_xxx_, [false, true, true, true, false]],
    [partialxx____, [true, true, false, false, false, false]],
    [
      partialxx_x_x_x__,
      [true, true, false, true, false, true, false, true, false, false],
    ],
  ],
  ([partial, guide]) => {
    const xs = [];
    const ys = [];
    const zs = [];
    for (let index = 0; index < guide.length; index += 1) {
      xs[index] = index;
      if (guide[index]) {
        ys[ys.length] = index;
      } else {
        zs[zs.length] = index;
      }
    }
    assertDeepEqual(
      apply(apply(partial, undefined, [returnArguments, ...ys]), undefined, zs),
      xs,
    );
  },
);

// assertDeepEqual(dropFirst((...xs) => xs)(1, 2, 3), [2, 3]);

// assertDeepEqual(
//   partialGeneric(returnArguments, 1, PARTIAL, 3, PARTIAL, 5)(2, 4),
//   [1, 2, 3, 4, 5],
// );

// assertDeepEqual(partial((...xs) => xs, 1, 2, 3)(4, 5, 6), [1, 2, 3, 4, 5, 6]);
//
// {
//   const partials = [partial1, partial2, partial3, partial4, partial5];
//   for (let index1 = 1; index1 <= 5; index1 += 1) {
//     const partialX = partials[index1 - 1];
//     assertThrow(() => partialX(generateReturnArguments(0), 1, 2, 3, 4, 5));
//     for (let index2 = index1; index2 <= 5; index2 += 1) {
//       assertDeepEqual(
//         apply(
//           partialX(generateReturnArguments(index2), 1, 2, 3, 4, 5),
//           undefined,
//           slice([1, 2, 3, 4, 5], index1, 5),
//         ),
//         slice([1, 2, 3, 4, 5], 0, index2),
//       );
//     }
//   }
// }
