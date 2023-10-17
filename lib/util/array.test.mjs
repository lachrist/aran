import { assertEqual } from "../test.fixture.mjs";

import {
  zip,
  enumerate,
  pairup,
  join,
  slice,
  removeDuplicate,
  flat,
  getLast,
  includes,
  some,
  every,
  map,
  flatMap,
  filter,
  filterOut,
  reduce,
  reduceReverse,
  removeAll,
  indexOf,
  lastIndexOf,
  // forEach,
  // push,
  // pushAll,
  // pop,
  // shift,
  // unshift,
} from "./array.mjs";

assertEqual(zip([1, 2, 3], [4, 5, 6, 7]), [
  [1, 4],
  [2, 5],
  [3, 6],
]);

assertEqual(enumerate(3), [0, 1, 2]);

assertEqual(pairup([1, 2, 3, 4, 5, 6, 7]), [
  [1, 2],
  [3, 4],
  [5, 6],
]);

assertEqual(pairup([]), []);

assertEqual(pairup([1]), []);

assertEqual(join([], ","), "");

assertEqual(join(["1", "2", "3"], ","), "1,2,3");

assertEqual(slice([1, 2, 3, 4], 1, 3), [2, 3]);

assertEqual(removeAll([1, 2, 2, 3, 4, 5], [2, 3]), [1, 4, 5]);

assertEqual(removeDuplicate([1, 2, 3, 2]), [1, 2, 3]);

assertEqual(
  flat([
    [1, 2],
    [3, 4],
  ]),
  [1, 2, 3, 4],
);

assertEqual(getLast([1, 2, 3]), 3);

assertEqual(includes([1, 2, 3], 2), true);

assertEqual(includes([1, 2, 3], 4), false);

assertEqual(
  some([1, 2, 3], (x) => x === 2),
  true,
);

assertEqual(
  some([1, 2, 3], (x) => x === 4),
  false,
);

assertEqual(
  every(
    [1, "foo", 3],
    /** @type {(x: unknown) => x is number} */ ((x) => typeof x === "number"),
  ),
  false,
);

assertEqual(
  every(
    [1, 2, 3],
    /** @type {(x: unknown) => x is number} */ ((x) => typeof x === "number"),
  ),
  false,
);

assertEqual(
  map([1, 2, 3], (x) => x * 2),
  [2, 4, 6],
);

assertEqual(
  flatMap([1, 2, 3], (x) => [x, x]),
  [1, 1, 2, 2, 3, 3],
);

assertEqual(
  filter([1, 2, 3], (x) => x % 2 === 0),
  [2],
);

assertEqual(
  filterOut([1, 2, 3], (x) => x % 2 === 0),
  [1, 3],
);

assertEqual(
  reduce(["1", "2", "3"], (x, y) => x + y, ""),
  "123",
);

assertEqual(
  reduceReverse(["1", "2", "3"], (x, y) => x + y, ""),
  "321",
);

assertEqual(indexOf([1, 2, 3], 2), 1);

assertEqual(indexOf([1, 2, 3], 4), -1);

assertEqual(lastIndexOf([1, 2, 3, 2], 2), 3);

assertEqual(lastIndexOf([1, 2, 3], 4), -1);

// {
//   /** @type {number[]} */
//   const xs = [];
//   forEach([1, 2, 3], (x) => push(xs, x));
//   assertEqual(xs, [1, 2, 3]);
// }

// {
//   /** @type {number[]} */
//   const xs = [];
//   pushAll(xs, [1, 2, 3]);
//   assertEqual(xs, [1, 2, 3]);
// }

// {
//   const xs = [1, 2, 3];
//   assertEqual(pop(xs), 3);
//   assertEqual(xs, [1, 2]);
// }

// {
//   const xs = [1, 2, 3];
//   assertEqual(shift(xs), 1);
//   assertEqual(xs, [2, 3]);
// }

// {
//   const xs = [1, 2, 3];
//   unshift(xs, 0);
//   assertEqual(xs, [0, 1, 2, 3]);
// }
