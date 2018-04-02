const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.META = {};
META.GLOBAL = Object.create(global);
META.GLOBAL.Date = () => "APRIL FOOL";
const aran = Aran({namespace:"META", sandbox:true});
META.GLOBAL.global = META.GLOBAL;
global.eval(Astring.generate(aran.setup(false)));
module.exports = (script) =>
  global.eval(Astring.generate(aran.weave(Acorn.parse(script), false)));