
var Aran = require("../main.js");
window.eval(Aran.setup);
module.exports = function (master, analysis) {
  window.eval(analysis);
  return Aran.instrument({loc:true, range:true, traps:Object.keys(aran.traps)}, target);
};
