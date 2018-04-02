const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const aran = Aran({namespace:"META", sandbox:true});
const instrument = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["eval"], parent));
global.META = {};
META.eval = (script, serial) => {
  console.log("DIRECT EVAL CALL:\n"+script+"\n");
  return instrument(script, serial);
};
META.GLOBAL = Object.create(global);
META.GLOBAL.eval = function eval (script) {
  console.log("INDIRECT EVAL CALL:\n"+script+"\n");
  return global.eval(instrument(script, null));
};
META.GLOBAL.Function = function Function () {
  const script = arguments.length ? [
    "(function anonymous("+Array.from(arguments).slice(0, -1).join(",")+"){",
    arguments[arguments.length-1],
    "})"
  ].join("\n") : "(function anonymous() {\n\n})";
  console.log("FUNCTION CALL:\n"+script+"\n");
  return global.eval(instrument(script, null));
};
META.GLOBAL.global = META.GLOBAL;
global.eval(Astring.generate(aran.setup(["eval"])));
module.exports = (script) => global.eval(instrument(script, null));