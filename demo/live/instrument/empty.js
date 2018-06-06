const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.ADVICE = {};
const aran = Aran({namespace:"ADVICE"});
global.eval(Astring.generate(aran.setup()));
module.exports = (script, source) => Astring.generate(aran.weave(Acorn.parse(script)));