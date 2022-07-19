import {assertThrow, assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {
  ROOT_SCOPE,
  hasScopeFrame,
  pushScopeFrame,
  encloseScope,
  popScopeFrame,
} from "./core.mjs";

assertEqual(hasScopeFrame(ROOT_SCOPE), false);

assertEqual(
  hasScopeFrame(encloseScope(pushScopeFrame(ROOT_SCOPE, "frame"))),
  true,
);

assertThrow(() => popScopeFrame(ROOT_SCOPE, false));

assertDeepEqual(popScopeFrame(pushScopeFrame(ROOT_SCOPE, "frame"), false), {
  scope: ROOT_SCOPE,
  frame: "frame",
  escaped: false,
});

assertDeepEqual(
  popScopeFrame(encloseScope(pushScopeFrame(ROOT_SCOPE, "frame")), false),
  {
    scope: ROOT_SCOPE,
    frame: "frame",
    escaped: true,
  },
);
