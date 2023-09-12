import { assertEqual } from "../../fixture.mjs";

import { hasOwn } from "../../../lib/util/object.mjs";

assertEqual(hasOwn({ key: "value" }, "key"), true);

assertEqual(hasOwn({ __proto__: { key: "value" } }, "key"), false);

/** @type {{foo:number} | {bar:number}} */
const o = true ? { foo: 123 } : { bar: 456 };

if (hasOwn(o, "foo")) {
  o.foo;
}