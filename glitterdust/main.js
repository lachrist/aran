
var Aran = require("../main.js");

function load (module) {
  if (module !== "aran")
    throw new Error("Only 'aran' can be required here.")
  return Aran;
}

module.exports = function (analysis, target) {
  var module = {};
  new Function("require", "module", "exports", "global", analysis)(load, module, {}, window);
  return module.exports(target, "target");
};
