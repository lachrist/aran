const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");

///////////
// Traps //
///////////
global.META = {};
META.eval = (script, serial) => {
  console.log("DIRECT EVAL CALL:\n"+script+"\n");
  return instrument(script, serial);
};

//////////
// Eval //
//////////
const eval = global.eval;
global.eval = function (script) {
  console.log("INDIRECT EVAL CALL:\n"+script+"\n");
  return ("indirect", eval)(instrument(script, null));
};
Object.defineProperty(global.eval, "name", {value:"eval", configurable:true});

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
  return ("indirect", eval)(instrument(script, null));
};
Object.defineProperty(global.Function, "length", {value:1, configurable:true});
global.Function.prototype = Function.prototype;
global.Function.prototype.constructor = global.Function;

///////////
// Setup //
///////////
const aran = Aran({namespace:"META"});
const instrument = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["eval"], parent));
eval(Astring.generate(aran.setup(["eval"])));
module.exports = (script) => ("indirect", eval)(instrument(script, null));
