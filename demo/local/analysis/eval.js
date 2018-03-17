const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const eval = global.eval;
const META = {};
META.eval = (script, serial) => {
  console.log("Direct eval call:\n"+script);
  return weave(script, aran.node(serial));
}
const aran = Aran({namespace:"META"});
const weave = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["eval"], parent));
module.exports = function (script) {
  console.log("Indirect eval call:\n"+script+"\n\n\n");
  return eval(weave(script, null));
};
global.eval = module.exports;
Object.defineProperty(global.eval, "name", {value:"eval", configurable:true});
eval(Astring.generate(aran.setup())); // Access: META, eval, global, global.eval
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
  console.log("Function call:\n"+script);
  return eval(weave(script, null));
};
Object.defineProperty(global.Function, "length", {value:1, configurable:true});
global.Function.prototype = Function.prototype;
global.Function.prototype.constructor = global.Function;