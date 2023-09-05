import {
  forEach,
  map,
  flatMap,
  concat_$,
  concat$$,
} from "../../lib/util/array.mjs";
import { assertEqual, assertThrow } from "../fixture.mjs";

/* eslint-disable import/no-namespace */
import * as Library from "../../lib/util/closure.mjs";
/* eslint-enable import/no-namespace */

const {
  Array,
  Reflect: { apply },
  String: {
    prototype: { indexOf: indexOfString, lastIndexOf: lastIndexOfString },
  },
  Reflect: { getOwnPropertyDescriptor },
  undefined,
} = globalThis;

/** @type {(x: number) => number} */
const tag = (x) => x + 100;

/** @type {(x: number) => number} */
const untag = (x) => x - 100;

/** @type {(size: number, prefixes: string[]) => string[]} */
const combine = (size, prefixes) => {
  if (size === 0) {
    return [""];
  } else {
    return flatMap(combine(size - 1, prefixes), (body) =>
      concat_$(
        body,
        map(prefixes, (prefix) => `${prefix}${body}`),
      ),
    );
  }
};

/** @type {<X> (...xs: X[]) => X[]} */
const listArgument = (...xs) => xs;

/** @type {(start: number, end: number) => number[]} */
const enumerate = (start, end) => {
  const array = Array(end - start);
  for (let index = start; index < end; index += 1) {
    array[index - start] = index;
  }
  return array;
};

// /** @type {(array: number[]) => number} */
// const sum = (array) => reduce(array, (x1, x2) => x1 + x2, 0);

forEach(combine(7, ["_"]), (description) => {
  // @ts-ignore
  const deadcode = Library[`deadcode${description}`];
  const throwDeadcodeError = deadcode("message");
  assertEqual(throwDeadcodeError.length, description.length);
  assertThrow(
    () =>
      apply(throwDeadcodeError, undefined, enumerate(0, description.length)),
    {
      name: "DeadcodeError",
      message: "message",
    },
  );
});

forEach(combine(6, ["_"]), (description) => {
  // @ts-ignore
  const noop = Library[`noop${description}`];
  assertEqual(noop.length, description.length);
  assertEqual(
    apply(noop, undefined, enumerate(0, description.length)),
    undefined,
  );
});

forEach(combine(7, ["_"]), (description) => {
  // @ts-ignore
  const constant = Library[`constant${description}`];
  const returnResult = constant("result");
  assertEqual(returnResult.length, description.length);
  assertEqual(
    apply(constant("result"), undefined, enumerate(0, description.length)),
    "result",
  );
});

// forEach(combine(6, ["_"]), (description) => {
//   // @ts-ignore
//   const bind = Library[`bind${description}`];
//   assertEqual(
//     apply(
//       bind(sum, listArgument),
//       undefined,
//       enumerate(0, description.length),
//     ),
//     sum(enumerate(0, description.length)),
//   );
// });

forEach(combine(6, ["", "_", "$"]), (description) => {
  if (getOwnPropertyDescriptor(Library, `return${description}`) !== undefined) {
    // @ts-ignore
    const return_ = Library[`return${description}`];
    assertEqual(return_.length, description.length);
    assertEqual(
      apply(return_, undefined, enumerate(0, description.length)),
      apply(indexOfString, description, ["$"]),
    );
  }
});

forEach(["$$", "_$$", "$_$", "$$_"], (description) => {
  const array = enumerate(0, description.length);
  const index1 = apply(indexOfString, description, ["$"]);
  const index2 = apply(lastIndexOfString, description, ["$"]);
  array[index1] = index2;
  array[index2] = index1;
  // @ts-ignore
  const flip = Library[`flip${description}`];
  const listArgumentFlip = flip(listArgument);
  assertEqual(listArgumentFlip.length, description.length);
  assertEqual(
    apply(listArgumentFlip, undefined, array),
    enumerate(0, description.length),
  );
});

// forEach(
//   concat$$(combine(6, ["", "_", "$"]), ["_____$$", "$$$$$_$"]),
//   (description) => {
//     if (getOwnPropertyDescriptor(Library, `drop${description}`) !== undefined) {
//       // @ts-ignore
//       const drop = Library[`drop${description}`];
//       const xs = [];
//       const ys = [];
//       for (let index = 0; index < description.length; index += 1) {
//         xs[xs.length] = index;
//         if (description[index] === "_") {
//           ys[ys.length] = index;
//         }
//       }
//       assertEqual(apply(drop(listArgument), undefined, xs), ys);
//     }
//   },
// );

forEach(
  concat$$(combine(6, ["", "_", "$", "f"]), [
    "$_$___$",
    "$$_____",
    "$______",
    "$$$____",
    "$_$____",
    "$$______",
    "$$$_____",
    "$$$______",
    "$$_$_$_$__",
    "$__$$_$_$_",
  ]),
  (description) => {
    if (
      getOwnPropertyDescriptor(Library, `partial${description}`) !== undefined
    ) {
      // @ts-ignore
      const partial = Library[`partial${description}`];
      const xs = [];
      const ys = [];
      for (let index = 0; index < description.length; index += 1) {
        if (description[index] === "$") {
          xs[xs.length] = index;
        } else if (description[index] === "f") {
          xs[xs.length] = untag;
          ys[ys.length] = tag(index);
        } else {
          ys[ys.length] = index;
        }
      }
      assertEqual(
        apply(apply(partial, undefined, [listArgument, ...xs]), undefined, ys),
        enumerate(0, description.length),
      );
    }
  },
);

// const concatTwice = (xs) => concat(xs, xs);

// const generatelistArgument = (length) => {
//   const f = (...xs) => xs;
//   defineProperty(f, "length", {value: length});
//   return f;
// };

// assertEqual(flip(generatelistArgument(0))(0), []);
// assertEqual(flip(generatelistArgument(1))(1), [undefined]);
// assertEqual(flip(generatelistArgument(2))(1, 2), [2, 1]);
// assertEqual(flip(generatelistArgument(3))(1, 2, 3), [2, 1, 3]);
// assertEqual(flip(generatelistArgument(4))(1, 2, 3, 4), [2, 1, 3, 4]);
// assertEqual(
//   flip(generatelistArgument(5))(1, 2, 3, 4, 5),
//   [2, 1, 3, 4, 5],
// );
// assertThrow(() => flip(generatelistArgument(6)));

// assertEqual(bind0(concatTwice, listArgument)(1, 2, 3, 4, 5, 6), []);
// assertEqual(bind1(concatTwice, listArgument)(1, 2, 3, 4, 5, 6), [1, 1]);
// assertEqual(
//   bind2(concatTwice, listArgument)(1, 2, 3, 4, 5, 6),
//   [1, 2, 1, 2],
// );
// assertEqual(
//   bind3(concatTwice, listArgument)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 1, 2, 3],
// );
// assertEqual(
//   bind4(concatTwice, listArgument)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 4, 1, 2, 3, 4],
// );
// assertEqual(
//   bind5(concatTwice, listArgument)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
// );
// assertEqual(
//   bind(concatTwice, listArgument)(1, 2, 3, 4, 5, 6),
//   [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6],
// );

// assertEqual(dropFirst((...xs) => xs)(1, 2, 3), [2, 3]);

// assertEqual(
//   partialGeneric(listArgument, 1, PARTIAL, 3, PARTIAL, 5)(2, 4),
//   [1, 2, 3, 4, 5],
// );

// assertEqual(partial((...xs) => xs, 1, 2, 3)(4, 5, 6), [1, 2, 3, 4, 5, 6]);
//
// {
//   const partials = [partial1, partial2, partial3, partial4, partial5];
//   for (let index1 = 1; index1 <= 5; index1 += 1) {
//     const partialX = partials[index1 - 1];
//     assertThrow(() => partialX(generatelistArgument(0), 1, 2, 3, 4, 5));
//     for (let index2 = index1; index2 <= 5; index2 += 1) {
//       assertEqual(
//         apply(
//           partialX(generatelistArgument(index2), 1, 2, 3, 4, 5),
//           undefined,
//           slice([1, 2, 3, 4, 5], index1, 5),
//         ),
//         slice([1, 2, 3, 4, 5], 0, index2),
//       );
//     }
//   }
// }
