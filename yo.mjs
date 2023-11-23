import { runInThisContext } from "vm";

runInThisContext(`
const g = function f(x, y = x) {
  var x;
  return {x, y};
}

console.log(g(123));
`);
