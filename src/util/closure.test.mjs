import {reduce, forEach, map, flatMap, concat} from "array-lite";

import {assertEqual, assertDeepEqual, assertThrow} from "../__fixture__.mjs";

/* eslint-disable import/no-namespace */
import * as Library from "./closure.mjs";
/* eslint-enable import/no-namespace */

import {assert} from "./closure.mjs";

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

const enumerate = (start, end) => {
  const array = Array(end - start);
  for (let index = start; index < end; index += 1) {
    array[index - start] = index;
  }
  return array;
};

const sum = (array) => reduce(array, (x1, x2) => x1 + x2, 0);

assertEqual(assert(true, "foo"), undefined);

assertThrow(() => assert(false, "foo"), {
  name: "AssertionError",
  message: "foo",
});

forEach(combine(6, ["_"]), (description) => {
  const deadcode = Library[`deadcode${description}`];
  assertThrow(
    () =>
      apply(deadcode("message"), undefined, enumerate(0, description.length)),
    {
      name: "DeadcodeError",
      message: "message",
    },
  );
});

forEach(combine(6, ["_"]), (description) => {
  const constant = Library[`constant${description}`];
  assertEqual(
    apply(constant("result"), undefined, enumerate(0, description.length)),
    "result",
  );
});

forEach(combine(6, ["_"]), (description) => {
  const bind = Library[`bind${description}`];
  assertDeepEqual(
    apply(
      bind(sum, returnArguments),
      undefined,
      enumerate(0, description.length),
    ),
    sum(enumerate(0, description.length)),
  );
});

forEach(combine(5, ["", "_", "x"]), (description) => {
  if (getOwnPropertyDescriptor(Library, `return${description}`) !== undefined) {
    const rreturn = Library[`return${description}`];
    assertEqual(
      apply(rreturn, undefined, enumerate(0, description.length)),
      apply(indexOfString, description, ["x"]),
    );
  }
});

forEach(["xx", "_xx", "x_x", "xx_"], (description) => {
  const array = enumerate(0, description.length);
  const index1 = apply(indexOfString, description, ["x"]);
  const index2 = apply(lastIndexOfString, description, ["x"]);
  array[index1] = index2;
  array[index2] = index1;
  const flip = Library[`flip${description}`];
  assertDeepEqual(
    apply(flip(returnArguments), undefined, array),
    enumerate(0, description.length),
  );
});

forEach(concat(combine(6, ["", "_", "x"]), ["_____xx"]), (description) => {
  if (getOwnPropertyDescriptor(Library, `drop${description}`) !== undefined) {
    const drop = Library[`drop${description}`];
    const xs = [];
    const ys = [];
    for (let index = 0; index < description.length; index += 1) {
      xs[xs.length] = index;
      if (description[index] === "_") {
        ys[ys.length] = index;
      }
    }
    assertDeepEqual(apply(drop(returnArguments), undefined, xs), ys);
  }
});

forEach(
  concat(combine(6, ["", "_", "x", "f"]), [
    "xx_____",
    "x______",
    "xxx____",
    "xx______",
    "xxx_____",
    "xxx______",
    "xx_x_x_x__",
  ]),
  (description) => {
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
        apply(
          apply(partial, undefined, [returnArguments, ...xs]),
          undefined,
          ys,
        ),
        enumerate(0, description.length),
      );
    }
  },
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
