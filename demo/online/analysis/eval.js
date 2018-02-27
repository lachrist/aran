const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const aran = Aran({namespace:"META",nosetup:true});
const join = (script, parent) =>
  Astring.generate(aran.join(Acorn.parse(script), ["eval"], parent));
const authentic = {
  eval: global.eval,
  Function: global.Function
};
global.eval = function eval (script) {
  postMessage("Indirect eval call:\n"+script+"\n\n");
  return authentic.eval(join(script, null));
};
global.Function = function Function () {
  if (arguments.length === 0)
    return module.exports("(function anonymous() {\n\n})");
  if (arguments.length === 1)
    return module.exports("(function anonymous() {\n"+arguments[0]+"\n})");
  var script = "(function anonymous("+arguments[0];
  for (let index=1, last = arguments.length-1; index < last; index++)
    script += ","+arguments[index];
  script += "){\n"+arguments[arguments.length-1]+"\n})";
  return module.exports(script);
};
global.Function.prototype = authentic.Function.prototype;
global.Function.prototype.constructor = global.Function;
global.META_eval = authentic.eval;
global.META = {
  eval: (script, serial) => {
    postMessage("Direct eval call:\n"+script+"\n\n");
    return join(script, aran.node(serial));
  }
};
authentic.eval(aran.setup());
module.exports = global.eval