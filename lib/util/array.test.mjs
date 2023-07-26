import { assertEqual } from "../fixture.mjs";

import {
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
  indexOf,
  lastIndexOf,
  forEach,
  push,
  pushAll,
  pop,
  shift,
  unshift,
  concat$$,
  concat$_,
  concat_$,
  concat_$_,
  concat$$$,
} from "./array.mjs";

assertEqual(join([], ","), "");

assertEqual(join(["1", "2", "3"], ","), "1,2,3");

assertEqual(slice([1, 2, 3, 4], 1, 3), [2, 3]);

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
  every([1, 2, 3], (x) => x < 4),
  true,
);

assertEqual(
  every([1, 2, 3], (x) => x < 3),
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

{
  /** @type {number[]} */
  const xs = [];
  forEach([1, 2, 3], (x) => push(xs, x));
  assertEqual(xs, [1, 2, 3]);
}

{
  /** @type {number[]} */
  const xs = [];
  pushAll(xs, [1, 2, 3]);
  assertEqual(xs, [1, 2, 3]);
}

{
  const xs = [1, 2, 3];
  assertEqual(pop(xs), 3);
  assertEqual(xs, [1, 2]);
}

{
  const xs = [1, 2, 3];
  assertEqual(shift(xs), 1);
  assertEqual(xs, [2, 3]);
}

{
  const xs = [1, 2, 3];
  unshift(xs, 0);
  assertEqual(xs, [0, 1, 2, 3]);
}

////////////
// Concat //
////////////

assertEqual(concat$$([1, 2], [3, 4]), [1, 2, 3, 4]);

assertEqual(concat$_([1, 2], 3), [1, 2, 3]);

assertEqual(concat_$(1, [2, 3]), [1, 2, 3]);

assertEqual(concat_$_(1, [2, 3], 4), [1, 2, 3, 4]);

assertEqual(concat$$$([1], [2, 3], [4, 5, 6]), [1, 2, 3, 4, 5, 6]);
