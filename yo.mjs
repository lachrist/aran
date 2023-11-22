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
  let x = "1";
  x += 1;
  console.log(x);
}
