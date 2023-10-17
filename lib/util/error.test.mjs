import { assert } from "../test.fixture.mjs";
import { StaticError } from "./error.mjs";

assert(
  new StaticError("msg", /** @type {never} */ (123)) instanceof StaticError,
);
