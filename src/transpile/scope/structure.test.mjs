import {assertThrow, assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {
  ROOT,
  isRoot,
  define,
  search,
  extend,
  enclose,
  fetch,
} from "./structure.mjs";

assertEqual(isRoot(ROOT), true);

assertEqual(isRoot(enclose(extend(ROOT, "frame"))), false);

assertThrow(() => search(ROOT, "key"), {
  name: "Error",
  message: "missing scope property",
});

assertEqual(search(enclose(define(ROOT, "key", "value")), "key"), "value");

assertThrow(() => fetch(ROOT, false));

assertDeepEqual(fetch(extend(ROOT, "frame"), false), {
  scope: ROOT,
  frame: "frame",
  escaped: false,
});

assertDeepEqual(fetch(enclose(extend(ROOT, "frame")), false), {
  scope: ROOT,
  frame: "frame",
  escaped: true,
});
