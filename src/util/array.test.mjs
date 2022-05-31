import {assertThrow, assertEqual, assertDeepEqual} from "../__fixture__.mjs";

import {empty, getLast, push, pop, pushAll, shift, unshift} from "./array.mjs";

const {undefined} = globalThis;

assertThrow(() => push(empty, 1));
assertDeepEqual(empty, []);

assertEqual(getLast([1, 2, 3]), 3);

{
  const array = [1, 2, 3];
  assertEqual(pop(array), 3);
  assertDeepEqual(array, [1, 2]);
}

{
  const array = [1, 2];
  assertEqual(push(array, 3), undefined);
  assertDeepEqual(array, [1, 2, 3]);
}

{
  const array = [1];
  assertEqual(pushAll(array, [2, 3]), undefined);
  assertDeepEqual(array, [1, 2, 3]);
}

{
  const array = [1, 2, 3];
  assertEqual(shift(array), 1);
  assertDeepEqual(array, [2, 3]);
}

{
  const array = [2, 3];
  assertEqual(unshift(array, 1), undefined);
  assertDeepEqual(array, [1, 2, 3]);
}
