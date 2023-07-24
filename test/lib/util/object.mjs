import { assertEqual } from "../../fixture.mjs";

import { hasOwn } from "../../../lib/util/object.mjs";

assertEqual(hasOwn({ key: "value" }, "key"), true);

assertEqual(hasOwn({ __proto__: { key: "value" } }, "key"), false);
