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

class C extends Object {
  constructor() {
    super(console.log("foo"));
    super(console.log("bar"));
  }
}

new C();
