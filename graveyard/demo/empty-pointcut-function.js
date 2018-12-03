const Acorn = require("acorn");
const Aran = require("aran");
global.ADVICE = {};
const aran = Aran({namespace: "ADVICE"});
module.exports = (script) => Astring.generate(aran.weave(Acorn.parse(script), (name, node) => {
  console.log(name, node.AranSerial, node.type);
  return false;
}));