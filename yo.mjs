// // const x = 123;

export default function f() {}

f();

// class C {
//   [(console.log("foo-key"), "foo")] = console.log("foo-value", x);
//   #foo = console.log("private-foo");
//   constructor(x) {
//     console.log("constructor");
//   }
// }

// new C();
// new C();

// class CC {
//   get #foo() {
//     console.log(this);
//     return 123;
//   }
//   m() {
//     return this.#foo;
//   }
// }

// const c = new CC();
// console.log(c.m());

/* eslint-disable */

// class C {
//   get #foo() {}
//   m(x) {
//     console.log(Reflect.setPrototypeOf(x, null));
//     console.log(x);
//     return x.#foo.name;
//   }
// }

// var c = new C();
// console.log(c.m(c));

// class CC {
//   #foo () {};
//   {
//     class C extends CC {
//       m (x) {
//         return x.#foo;
//       }
//     };
//     const c = new C();
//     console.log(c.m());
//   }
// }
