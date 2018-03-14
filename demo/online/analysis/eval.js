const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const aran = Aran({namespace:"META"});
const weave = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["eval"], parent));
let META = {
  eval: (script, serial) => {
    postMessage("Direct eval call:\n"+script+"\n\n\n");
    return weave(script, aran.node(serial));
  }
};
// Eval //
const eval = global.eval;
module.exports = global.eval = function (script) {
  postMessage("Indirect eval call:\n"+script+"\n\n\n");
  return eval(weave(script, null));
};
Object.defineProperty(global.eval, "name", {value:"eval", configurable:true});
// Function //
const Function = global.Function;
global.Function = function Function () {
  if (arguments.length === 0) {
    var script = module.exports("(function anonymous() {\n\n})");
  } else if (arguments.length === 1) {
    var script = module.exports("(function anonymous() {\n"+arguments[0]+"\n})");
  } else {
    var script = "(function anonymous("+arguments[0];
    for (let index=1, last = arguments.length-1; index < last; index++)
      script += ","+arguments[index];
    script += "){\n"+arguments[arguments.length-1]+"\n})";
  }
  postMessage("Function call:\n"+script+"\n\n\n");
  return eval(weave(script, null));
};
Object.defineProperty(global.Function, "length", {value:1, configurable:true});
global.Function.prototype = Function.prototype;
global.Function.prototype.constructor = global.Function;
// Setup //
eval(Astring.generate(aran.setup()));
