
var Aran = require("../main.js");
module.exports = function (analysis, target) {
  window.eval(analysis);
  return Aran({loc:true, range:true, traps:Object.keys(aran)}, target);
};
