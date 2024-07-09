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
  console.log(1, { f, ff: globalThis.f });
  f = 123;
  console.log(2, { f, ff: globalThis.f });
  {
    console.log(3, { f, ff: globalThis.f });
    function f () {}
    console.log(4, { f, ff: globalThis.f });
  }
  console.log(5, { f, ff: globalThis.f });
  f = 456;
  console.log(6, { f, ff: globalThis.f });
`);
