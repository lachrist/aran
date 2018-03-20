const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const geval = global.eval;
global.META = {};
META.eval = (script, serial) => {
  console.log("DIRECT EVAL CALL:\n"+script+"\n");
  return weave(script, aran.node(serial));
}
const aran = Aran({namespace:"META"});
const weave = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["eval"], parent));
module.exports = function (script) {
  console.log("INDIRECT EVAL CALL:\n"+script+"\n");
  return geval(weave(script, null));
};
global.eval = module.exports;
Object.defineProperty(global.eval, "name", {value:"eval", configurable:true});
{
  let eval = geval;
  eval(Astring.generate(aran.setup()));
}
//////////////
// Function //
//////////////
const Function = global.Function;
global.Function = function Function () {
  const script = arguments.length ? [
    "(function anonymous("+Array.from(arguments).slice(0, -1).join(",")+"){",
    arguments[arguments.length-1],
    "})"
  ].join("\n") : "(function anonymous() {\n\n})";
  console.log("FUNCTION CALL:\n"+script+"\n");
  return geval(weave(script, null));
};
Object.defineProperty(global.Function, "length", {value:1, configurable:true});
global.Function.prototype = Function.prototype;
global.Function.prototype.constructor = global.Function;