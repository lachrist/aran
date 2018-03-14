const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
const PrintLite = require("print-lite");
const aran = Aran({namespace:"META"});
global.META = {};
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  script = Astring.generate(aran.weave(Acorn.parse(script), false, null));
  postMessage(script+"\n");
  postMessage("Success: "+PrintLite(global.eval(script))+"\n");
};