// import { runInThisContext } from "vm";

// runInThisContext(
//   `
//     with ({
//       method: function () {
//         "use strict";
//         console.log(this);
//       },
//     }) {
//       const f = method;
//       f();
//     }
// `,
// );

import { parse } from "acorn";

console.dir(
  parse("foo?.bar.qux;", { ecmaVersion: 2022, sourceType: "module" }),
  {
    depth: null,
  },
);

// f?(123)?(456);

let foo;

foo = null;
console.log(foo?.bar.qux);

foo = { bar: null };
console.log(foo?.bar.qux);
