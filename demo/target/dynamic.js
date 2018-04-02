let double = Function("x", "return 2 * x");
let x = null;
console.log(eval([
  "global.x = 123;",
  "double(global.eval('x'));",
].join("\n")));