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

{
  let o = { valueOf: () => 1 };
  let x = o--;
  console.log(x);
}
