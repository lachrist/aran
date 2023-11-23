let x;

export { x as default };

import { default as xx } from "./yo.mjs";

console.log("foo", { x, xx });

{
  x = function f() {};
}

console.log("bar", { x, xx });
