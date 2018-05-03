let double = Function("x", "return 2 * x");
let x = null;
console.log(eval([
  "this.x = 123;",
  "double(this.eval('x'));",
].join("\n")));