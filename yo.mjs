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

const __proto__ = 123;

const object = { __proto__: 456 };

console.log(Reflect.getPrototypeOf(object) === Object.prototype);
