import { assertEqual } from "../fixture.mjs";

import { hasOwn, getDeep } from "./object.mjs";

assertEqual(hasOwn({ key: "value" }, "key"), true);

assertEqual(hasOwn({ __proto__: { key: "value" } }, "key"), false);

assertEqual(getDeep({ foo: { bar: 123 } }, ["foo", "bar"]), 123);

/** @type {{foo:number} | {bar:number}} */
const o = true ? { foo: 123 } : { bar: 456 };

if (hasOwn(o, "foo")) {
  o.foo;
}
