// {
//   let o = {
//     get x() {
//       return false;
//     },
//     set x(y) {
//       ARAN("FOOBAR");
//     },
//   };
//   o.x &&= 123;
// }

// console.log(Object.getOwnPropertyDescriptors(Symbol.prototype));

import { runInThisContext } from "vm";

runInThisContext(
  `

class C extends null {
  [(delete x)] = 123;

}

`,
);
