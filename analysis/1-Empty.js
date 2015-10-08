
// This analysis does absolutely nothing! *yay* //
var global = (function () { return this } ());
var Aran = require("aran");
global.aran = Aran();
module.exports = global.aran.compile;
