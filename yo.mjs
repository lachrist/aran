// function* g() {
//   yield 0;
//   yield 1;
//   yield 2;
// }

// class TestIterator extends Iterator {
//   get next() {
//     let n = g();
//     return function () {
//       return n.next();
//     };
//   }
//   return() {
//     throw new Test262Error();
//   }
// }

// const x = new TestIterator();
// x.drop(0).next();

import c from "./yo.mjs";

new c();
let x = 123;

export default class {
  constructor() {
    x;
  }
}
