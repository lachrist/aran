// This analysis does absolutely nothing! *yay* //
var Aran = require("aran");
global.__hidden__ = {};
var aran = Aran({namespace:"__hidden__", traps:[]});
module.exports = aran.instrument;