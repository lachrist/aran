import { assertEqual } from "../test.fixture.mjs";
import { hasNarrowObject } from "./object.mjs";
import * as Array from "./array.mjs";

const {
  Error,
  Array: { isArray },
} = globalThis;

const {
  zip,
  enumerate,
  pairupArray,
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
  mapIndex,
} = Array;

assertEqual(zip([1, 2, 3], [4, 5, 6, 7]), [
  [1, 4],
  [2, 5],
  [3, 6],
]);

assertEqual(enumerate(3), [0, 1, 2]);

assertEqual(pairupArray([1, 2, 3, 4, 5, 6, 7]), [
  [1, 2],
  [3, 4],
  [5, 6],
]);

assertEqual(pairupArray([]), []);

assertEqual(pairupArray([1]), []);

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
  true,
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

////////////
// Concat //
////////////

/**
 * @type {(
 *   length: number,
 *   parts: string[],
 * ) => string[]}
 */
const combine = (length, parts) => {
  if (length === 0) {
    return [""];
  } else {
    return flatMap(combine(length - 1, parts), (result) =>
      map(parts, (prefix) => prefix + result),
    );
  }
};

/**
 * @type {(length: number) => string[]}
 */
const combineConcat = (length) => combine(length, ["X", "_"]);

for (const cat of flatMap([1, 2, 3, 4, 5, 6], combineConcat)) {
  const key = `concat${cat}`;
  if (hasNarrowObject(Array, key)) {
    const concat = /** @type {(... xs: (string | string[])[]) => string[]} */ (
      Array[key]
    );
    const args = mapIndex(cat.length, (index) => {
      switch (cat[index]) {
        case "X": {
          return [`${index}_1`, `${index}_2`, `${index}_3`];
        }
        case "_": {
          return `${index}`;
        }
        default: {
          throw new Error(cat);
        }
      }
    });
    assertEqual(
      concat(...args),
      flat(map(args, (args) => (isArray(args) ? args : [args]))),
    );
  }
}
