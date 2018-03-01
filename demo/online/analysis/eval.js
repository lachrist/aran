const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const aran = Aran({namespace:"META"});
const join = (script, parent) =>
  Astring.generate(aran.join(Acorn.parse(script), ["eval"], parent));
const authentic = {
  eval: global.eval,
  Function: global.Function
};
global.eval = function eval (script) {
  postMessage("Indirect eval call:\n"+script+"\n\n\n");
  return authentic.eval(join(script, null));
};
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
  return authentic.eval(join(script, null));
};
global.Function.prototype = authentic.Function.prototype;
global.Function.prototype.constructor = global.Function;
global.META_eval = authentic.eval;
global.META = {
  eval: (script, serial) => {
    postMessage("Direct eval call:\n"+script+"\n\n\n");
    return join(script, aran.node(serial));
  }
};
module.exports = global.eval;