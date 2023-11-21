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

// class c {
//   static [(console.log("foo"), "foo")]() {}
//   static ["prototype"]() {}
//   static [(console.log("bar"), "bar")]() {}
// }

class C {
  static [{
    toString() {
      console.log("foo-key");
      return "foo";
    },
  }] = console.log("foo-val");
  static [{
    toString() {
      console.log("bar-key");
      return "bar";
    },
  }] = console.log("bar-val");
}

// class C {
//   static [(console.log("yoo", this), "foo")] = this;
// static #foo = "foo";
// static [(console.log(
//   "foo-key",
//   setTimeout(() => {
//     console.log("grunt", C.#foo);
//   }),
// ),
// "foo")] = console.log("foo-val");
// static {
//   console.log("bar");
// }
// static [(console.log("qux-key"), "qux")] = console.log("qux-val");
// static #foo = 123;
// #foo() {456 };
// #m1() {
//   this.#m2();
// }
// #m2() {
//   this.#m1();
// }
// m() {
//   console.log(this.#m1());
// }
// }

// console.log(C.foo);

// const c = new C();
//
// console.log(C.foo);

// console.log(c.m());

// console.log("foo");
