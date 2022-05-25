import {forEach, map, flatMap, concat} from "array-lite";

import {assertEqual, assertDeepEqual, assertThrow} from "../__fixture__.mjs";

/* eslint-disable import/no-namespace */
import * as Library from "./closure.mjs";
/* eslint-enable import/no-namespace */

import {assert, partialxx____, partialxx_x_x_x__} from "./closure.mjs";

const {
  Array,
  Reflect: {apply},
  String: {
    prototype: {indexOf: indexOfString, lastIndexOf: lastIndexOfString},
  },
  Reflect: {getOwnPropertyDescriptor},
  undefined,
} = globalThis;

const tag = (x) => x + 100;

const untag = (x) => x - 100;

const populateIndex = (_element, index, _array) => index;

const combine = (size, prefixes) => {
  if (size === 0) {
    return [""];
  } else {
    return flatMap(combine(size - 1, prefixes), (body) =>
      concat(
        [body],
        map(prefixes, (prefix) => `${prefix}${body}`),
      ),
    );
  }
};

const returnArguments = (...xs) => xs;

assertEqual(assert(true, "foo"), undefined);

assertThrow(() => assert(false, "foo"), {
  name: "AssertionError",
  message: "foo",
});

forEach(combine(4, "_"), (description) => {
  const deadcode = Library[`deadcode${description}`];
  assertThrow(
    () => apply(deadcode("message"), undefined, Array(description.length)),
    {
      name: "DeadcodeError",
      message: "message",
    },
  );
});

forEach(combine(5, "_"), (description) => {
  const constant = Library[`constant${description}`];
  assertEqual(
    apply(constant("result"), undefined, Array(description.length)),
    "result",
  );
});

forEach(
  ["x", "x_", "_x", "x__", "_x_", "__x", "x___", "_x__", "__x_", "___x"],
  (description) => {
    const array = Array(description.length);
    array[apply(indexOfString, description, ["x"])] = "result";
    const rreturn = Library[`return${description}`];
    assertEqual(apply(rreturn, undefined, array), "result");
  },
);

forEach(["xx", "_xx", "x_x", "xx_"], (description) => {
  const array = map(Array(description.length), populateIndex);
  const index1 = apply(indexOfString, description, ["x"]);
  const index2 = apply(lastIndexOfString, description, ["x"]);
  array[index1] = index2;
  array[index2] = index1;
  const flip = Library[`flip${description}`];
  assertDeepEqual(
    apply(flip(returnArguments), undefined, array),
    map(Array(description.length), populateIndex),
  );
});

forEach(combine(5, ["", "_", "x", "f"]), (description) => {
  if (
    getOwnPropertyDescriptor(Library, `partial${description}`) !== undefined
  ) {
    const partial = Library[`partial${description}`];
    const xs = [];
    const ys = [];
    for (let index = 0; index < description.length; index += 1) {
      if (description[index] === "x") {
        xs[xs.length] = index;
      } else if (description[index] === "f") {
        xs[xs.length] = untag;
        ys[ys.length] = tag(index);
      } else {
        ys[ys.length] = index;
      }
    }
    assertDeepEqual(
      apply(apply(partial, undefined, [returnArguments, ...xs]), undefined, ys),
      map(Array(description.length), populateIndex),
    );
  }
});

assertDeepEqual(
  partialxx____(returnArguments, 1, 2)(3, 4, 5, 6),
  [1, 2, 3, 4, 5, 6],
);

assertDeepEqual(
  partialxx_x_x_x__(returnArguments, 1, 2, 4, 6, 8)(3, 5, 7, 9, 0),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
);

// const concatTwice = (xs) => concat(xs, xs);

// const generateReturnArguments = (length) => {
//   const f = (...xs) => xs;
//   defineProperty(f, "length", {value: length});
//   return f;
// };

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
