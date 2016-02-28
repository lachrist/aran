
var Instrument = require("../instrument.js");

module.exports = function (analysis, target) {
  window.eval(analysis);
  var instrument = Instrument({loc:true, traps:Object.keys(aran)});
  return instrument(target, "master");
};
