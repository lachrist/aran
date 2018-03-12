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
const substitute = {
  eval: function eval (script) {
    postMessage("Indirect eval call:\n"+script+"\n\n\n");
    return authentic.eval(join(script, null));
  },
  Function: function Function () {
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
  }
};
substitute.Function.prototype = authentic.Function.prototype;
substitute.Function.prototype.constructor = authentic.Function;
global.eval = substitute.eval;
global.Function = substitute.function;
global.META_eval = authentic.eval;
global.META_iseval = (value) => value === substitute.eval;
global.META = {
  eval: (script, serial) => {
    postMessage("Direct eval call:\n"+script+"\n\n\n");
    return join(script, aran.node(serial));
  }
};
module.exports = substitute.eval;