import { assertEqual } from "../test.fixture.mjs";
import { hasNarrowKey, hasNarrowObject, hasOwn } from "./object.mjs";

const { Error } = globalThis;

assertEqual(hasOwn({ key: "value" }, "key"), true);

/** @type {{foo:number} | {bar:number}} */
const o = true ? { foo: 123 } : { bar: 456 };

if (hasOwn(o, "foo")) {
  // eslint-disable-next-line local/no-pure-statement
  2 * o.foo;
}

if (hasNarrowObject(o, "qux")) {
  throw new Error("unreachable");
}

if (hasNarrowKey(o, "qux")) {
  throw new Error("unreachable");
}
