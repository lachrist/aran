// import { runInThisContext } from "vm";

// runInThisContext(`
//   function f () {
//     var arguments;
//     console.log(arguments);
//   }
//   f();
// `);

// function f(x, y = () => x) {
//   // return x;
//   let x;
//   return { x1: x, x2: y() };
//   // var x = 456;
// }

// console.log(f(123));

// const f = (x, probe = () => x) => {
//   console.log({ x, probe: probe() });
//   var x = 456;
//   console.log({ x, probe: probe() });
// };

// f(123);
