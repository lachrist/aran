import { assert } from "../fixture.mjs";
import { StaticError, DynamicError } from "./error.mjs";

assert(
  new StaticError("msg", /** @type {never} */ (123)) instanceof StaticError,
);

assert(new DynamicError("msg", 123) instanceof DynamicError);
