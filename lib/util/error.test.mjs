import { assert, assertEqual, assertThrow } from "../test.fixture.mjs";
import {
  StaticError,
  DynamicError,
  assert as assert_,
  AssertionError,
} from "./error.mjs";

const { undefined } = globalThis;

assert(
  new StaticError("msg", /** @type {never} */ (123)) instanceof StaticError,
);

assert(new DynamicError("msg", 123) instanceof DynamicError);

assert(new AssertionError("msg") instanceof AssertionError);

assertThrow(() => assert_(false, "msg"), AssertionError, "msg");

assertEqual(assert_(true, "msg"), undefined);
