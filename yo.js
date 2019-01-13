const LinvailCheck = require("./demo/live/linvail-check.js")

global.eval(LinvailCheck(`
  let o = {};
  o.a = "foo";
  o.a = "bar";
  o;
`));
