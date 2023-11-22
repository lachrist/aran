// let yo = null;

// const CC = class C extends ((yo = () => C), null) {};

// const CC = (() => {
//   let C;

// } ());

// console.log(yo());

// // const c = new CC();

// // console.log(Object.getOwnPropertyDescriptors(c));

// // // console.log(CC.foo.name);

// const x = new WeakMap();
// console.log(x.set({}, 123));

import { runInThisContext } from "vm";
runInThisContext(`

{
  function f () {}
  f = 123;
}
f();
`);
