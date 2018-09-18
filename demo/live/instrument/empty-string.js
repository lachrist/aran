const Acorn = require("acorn");
const Aran = require("aran");
global.ADVICE = {};
const aran = Aran({namespace:"ADVICE", format:"String"});
module.exports = (script) => aran.weave(Acorn.parse(script), []);