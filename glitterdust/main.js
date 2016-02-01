
var Instrument = require("../instrument.js");

module.exports = function (analysis, target) {
  window.eval(analysis);
  return Instrument({loc:true, traps:Object.keys(aran)})(null, target);
};
