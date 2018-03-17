let double = Function("x", "return 2 * x");
let x = null;
console.log(eval([
  "self.x = 123;",
  "double(self.eval('x'));",
].join("\n")));