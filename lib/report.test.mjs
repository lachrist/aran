import { assert } from "./test.fixture.mjs";
import { AranTypeError } from "./report.mjs";

assert(new AranTypeError(/** @type {never} */ (123)) instanceof AranTypeError);
