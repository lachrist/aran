import {assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {ROOT, set, get, extend, enclose, fetch} from "./list.mjs";

assertThrow(() => enclose(get(ROOT, "key")));

assertEqual(set(ROOT, "key", "value"), "value");

assertThrow(() => fetch(ROOT, false));

assertDeepEqual(fetch(extend(ROOT, "frame"), false), {
  scope: ROOT,
  frame: "frame",
  escped: false,
});

assertDeepEqual(fetch(enclose(extend(ROOT, "frame")), false), {
  scope: ROOT,
  frame: "frame",
  escped: true,
});
