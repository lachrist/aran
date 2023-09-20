import { assertEqual } from "../test.fixture.mjs";

import { hasOwn } from "./object.mjs";

assertEqual(hasOwn({ key: "value" }, "key"), true);

assertEqual(hasOwn({ __proto__: { key: "value" } }, "key"), false);

/** @type {{foo:number} | {bar:number}} */
const o = true ? { foo: 123 } : { bar: 456 };

if (hasOwn(o, "foo")) {
  2 * /** @type {{foo: number}} */ (o).foo;
}
