import {assertEqual} from "../__fixture__.mjs";

import {set, get, hasOwn} from "./object.mjs";

const {undefined} = globalThis;

{
  const object = {key: "value"};
  assertEqual(set(object, "key", "VALUE"), undefined);
  assertEqual(get(object, "key"), "VALUE");
}

assertEqual(hasOwn({key: "value"}, "key"), true);

assertEqual(hasOwn({__proto__: {key: "value"}}, "key"), false);
