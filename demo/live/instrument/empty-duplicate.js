const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.ADVICE = {};
const aran1 = Aran({namespace:"ADVICE"});
global.eval(Astring.generate(aran1.setup()));
module.exports = (script) => {
  const aran2 = Aran({namespace:aran1.namespace, roots:aran1.roots});
  return Astring.generate(aran2.weave(Acorn.parse(script)));
};
