import {assertThrow, assertEqual, assertDeepEqual} from "../__fixture__.mjs";

import {empty, getLast, push, pop} from "./array.mjs";

const {undefined} = globalThis;

assertThrow(() => push(empty, 1));
assertDeepEqual(empty, []);

assertEqual(getLast(["element1", "element2"]), "element2");

{
  const array = ["element1", "element2"];
  assertEqual(pop(array), "element2");
  assertDeepEqual(array, ["element1"]);
}

{
  const array = ["element1"];
  assertEqual(push(array, "element2"), undefined);
  assertDeepEqual(array, ["element1", "element2"]);
}
