import { runInThisContext } from "vm";

runInThisContext(`
const g = function f(x = f) {
  // var f;
  return f;
}

console.log(g());
`);
