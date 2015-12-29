
// This analysis does absolutely nothing! *yay* //

var Aran = require("aran");
eval(Aran.setup);
aran.traps = {};
module.exports = Aran.compile.bind(null, {traps:[], offset:0});
