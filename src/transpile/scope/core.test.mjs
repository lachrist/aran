import {assertThrow, assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {
  ROOT,
  isRoot,
  defineBinding,
  lookupBinding,
  appendFrame,
  enclose,
  drawFrame,
} from "./core.mjs";

assertEqual(isRoot(ROOT), true);

assertEqual(isRoot(enclose(appendFrame(ROOT, "frame"))), false);

assertThrow(() => lookupBinding(ROOT, "key"), {
  name: "Error",
  message: "missing scope property",
});

assertEqual(
  lookupBinding(enclose(defineBinding(ROOT, "key", "value")), "key"),
  "value",
);

assertThrow(() => drawFrame(ROOT, false));

assertDeepEqual(drawFrame(appendFrame(ROOT, "frame"), false), {
  scope: ROOT,
  frame: "frame",
  escaped: false,
});

assertDeepEqual(drawFrame(enclose(appendFrame(ROOT, "frame")), false), {
  scope: ROOT,
  frame: "frame",
  escaped: true,
});
