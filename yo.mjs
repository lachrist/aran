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
  parse(`

const o = {
  m() {
    foo?.bar?.();
  },
};

`),
  { depth: null },
);
