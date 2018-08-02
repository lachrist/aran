const Acorn = require("acorn");
const Aran = require("aran");
global.ADVICE = {};
const aran = Aran({namespace:"ADVICE", format:"String"});
global.eval(aran.setup());
module.exports = (script) => aran.weave(Acorn.parse(script), (name, node) => {
  console.log(name, node.AranSerial, node.type);
  return false;
});