import {assertEqual} from "../__fixture__.mjs";

import {set, get, hasOwnProperty} from "./object.mjs";

const {undefined} = globalThis;

{
  const object = {key: "value"};
  assertEqual(set(object, "key", "VALUE"), undefined);
  assertEqual(get(object, "key"), "VALUE");
}

assertEqual(hasOwnProperty({key: "value"}, "key"), true);

assertEqual(hasOwnProperty({__proto__: {key: "value"}}, "key"), false);
