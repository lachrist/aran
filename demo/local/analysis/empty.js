const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.META = {};
const aran = Aran({namespace:"META"});
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  script = Astring.generate(aran.weave(Acorn.parse(script), false, null));
  console.log(script);
  global.eval(script);
};