import { assert } from "./test.fixture.mjs";
import { AranTypeError } from "./error.mjs";

assert(
  new AranTypeError("msg", /** @type {never} */ (123)) instanceof AranTypeError,
);
