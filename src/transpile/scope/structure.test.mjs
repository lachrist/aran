import {assertThrow, assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {ROOT, define, search, extend, enclose, fetch} from "./structure.mjs";

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
