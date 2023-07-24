import { assertThrow } from "../../fixture.mjs";

import { assert } from "../../../lib/util/assert.mjs";

assertThrow(() => assert(false, "message"), {
  name: "AssertionError",
  message: "message",
});
