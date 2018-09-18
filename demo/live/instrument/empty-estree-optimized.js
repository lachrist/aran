const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.ADVICE = {};
const aran = Aran({namespace:"ADVICE", format:"EstreeOptimized"});
module.exports = (script) => Astring.generate(aran.weave(Acorn.parse(script), []));