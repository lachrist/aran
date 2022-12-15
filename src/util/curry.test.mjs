import {
  generateAssertUnreachable,
  assertEqual,
  assertDeepEqual,
} from "../__fixture__.mjs";

import {
  makeCurry,
  extendCurry,
  callCurry,
  forEachCurry,
  findCurry,
  mapCurry,
  filterOutCurry,
} from "./curry.mjs";

const { undefined } = globalThis;

assertDeepEqual(
  callCurry(
    extendCurry(
      makeCurry((...args) => args, 1, 2, 3),
      4,
      5,
      6,
    ),
    7,
    8,
    9,
  ),
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
);

assertEqual(
  findCurry(
    ["element"],
    makeCurry((...args) => {
      assertDeepEqual(args, ["curry", "element", 0, ["element"]]);
      return true;
    }, "curry"),
  ),
  "element",
);

assertEqual(
  findCurry(
    [],
    makeCurry(generateAssertUnreachable("should not be called"), "curry"),
  ),
  null,
);

assertDeepEqual(
  mapCurry(
    ["element"],
    makeCurry((...args) => args, "curry"),
  ),
  [["curry", "element", 0, ["element"]]],
);

assertDeepEqual(
  filterOutCurry(
    [1, 2, 3, 4],
    makeCurry((curry, element, index, elements, ...rest) => {
      assertEqual(curry, "curry");
      assertEqual(element, index + 1);
      assertDeepEqual(elements, [1, 2, 3, 4]);
      assertDeepEqual(rest, []);
      return element > 2;
    }, "curry"),
  ),
  [1, 2],
);

{
  let sum = 0;
  assertEqual(
    forEachCurry(
      [1, 2, 3],
      makeCurry((curry, element, index, elements, ...rest) => {
        assertEqual(curry, "curry");
        assertEqual(element, index + 1);
        assertDeepEqual(elements, [1, 2, 3]);
        assertDeepEqual(rest, []);
        sum += element;
      }, "curry"),
    ),
    undefined,
  );
  assertEqual(sum, 6);
}
