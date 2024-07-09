// const getF = () => f;
// console.log({ f, getF: getF() });
// function f() {
//   console.log({ f, getF: getF() });
//   f = 123;
//   console.log({ f, getF: getF() });
// }
// f();
// console.log({ f, getF: getF() });

import { runInThisContext } from "vm";
runInThisContext(`
((() => {
  try {
    throw null;
  } catch (f) {
    {
      function f() { return 123; }
    }
  }
  console.log(f());
})());

`);
