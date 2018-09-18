const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.ADVICE = {};
const aran1 = Aran({namespace:"ADVICE"});
module.exports = (script) => {
  const aran2 = Aran(JSON.parse(JSON.stringify(aran1)));
  return Astring.generate(aran2.weave(Acorn.parse(script), []));
};