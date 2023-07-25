import { assertThrow } from "../fixture.mjs";

import { assert } from "./assert.mjs";

assertThrow(() => assert(false, "message"), {
  name: "AssertionError",
  message: "message",
});
