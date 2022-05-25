import {assertThrow, assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {ROOT, set, get, extend, enclose, fetch} from "./list.mjs";

assertThrow(() => get(ROOT, "key"), {
  name: "Error",
  message: "missing scope property",
});

assertEqual(get(enclose(set(ROOT, "key", "value")), "key"), "value");

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
