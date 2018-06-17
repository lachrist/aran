const Acorn = require("acorn");
const Aran = require("aran");
global.ADVICE = {};
const aran = Aran({namespace:"ADVICE", output:"String"});
global.eval(aran.setup());
module.exports = (script) => aran.weave(Acorn.parse(script));