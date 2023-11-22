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

let foo = null;

foo &&= () => {};

console.log(foo.name);
