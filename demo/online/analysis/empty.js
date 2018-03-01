const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
const PrintLite = require("print-lite");
const aran = Aran();
module.exports = (script) => {
  script = Astring.generate(aran.join(Acorn.parse(script), false, null));
  postMessage(script+"\n");
  postMessage("Success: "+PrintLite(global.eval(script))+"\n");
};