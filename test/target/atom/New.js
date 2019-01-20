let o = {};
let F = function () { return o }
if (new F() !== o)
  throw new Error("New");
