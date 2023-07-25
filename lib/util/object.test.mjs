import { assertEqual } from "../fixture.mjs";

import { hasOwn, getDeep } from "./object.mjs";

assertEqual(hasOwn({ key: "value" }, "key"), true);

assertEqual(hasOwn({ __proto__: { key: "value" } }, "key"), false);

assertEqual(getDeep({ foo: { bar: 123 } }, ["foo", "bar"]), 123);
