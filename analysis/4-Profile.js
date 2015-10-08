
// This analysis profile accesses to objects //
var global = (function () { return this } ());
var Aran = require("aran");
var shadows = new Map();
global.logShadows = function () {
  shadows.forEach(function (val, key) {
    console.dir({base:key, meta:val});
  });
};
function profile (obj, ast) {
  shadows.set(obj, {
    origin: ast.loc.start.line+"-"+ast.loc.start.column,
    get:0,
    set:0
  });
  return obj;
}
function update (op, obj) {
  if (shadows.has(obj))
    shadows.get(obj)[op]++;
}
global.aran = Aran({
  ast: true,
  loc: true,
  traps: {
    object: profile,
    construct: function (f, xs, n) { return profile(new f(...xs), n) },
    get: function (o, k, n) { return (update("get", o), o[k]) },
    set: function (o, k, v, n) { return (update("set" , o), o[k]=v) }
  }
});
module.exports = global.aran.compile;
