import { assertEqual, assertThrow } from "../__fixture__.mjs";
import { assert } from "./assert.mjs";

const { undefined } = globalThis;

assertEqual(assert(true, "message"), undefined);

assertThrow(() => assert(false, "message"), /^AssertionError: message$/u);
