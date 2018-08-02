const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.ADVICE = {};
const aran = Aran({namespace:"ADVICE"});
global.eval(Astring.generate(aran.setup()));
const roots = aran.roots;
module.exports = (script) => Astring.generate(Aran({namespace:"ADVICE", roots:[]}).weave(Acorn.parse(script)));