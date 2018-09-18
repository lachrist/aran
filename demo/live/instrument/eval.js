const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
// Sandbox //
const sandbox = {};
sandbox.global = sandbox;
sandbox.self = sandbox;
sandbox.window = sandbox;
sandbox.eval = function eval (script) {
  console.log("INDIRECT EVAL CALL:\n"+script+"\n");
  return global.eval(instrument(script));
};
sandbox.Function = function Function () {
  const script = arguments.length ? [
    "(function anonymous("+Array.from(arguments).slice(0, -1).join(",")+"){",
    arguments[arguments.length-1],
    "})"
  ].join("\n") : "(function anonymous() {\n\n})";
  console.log("FUNCTION CALL:\n"+script+"\n");
  return global.eval(instrument(script, "global"));
};
Object.setPrototypeOf(sandbox, global);
// Advice //
global.ADVICE = {
  arrival: (scope, arguments, serial) => {
    if (scope.this === global)
      scope.this = sandbox;
    return arguments;
  },
  program: (scope, global, serial) => {
    if (scope.this === global)
      scope.this = sandbox;
    return sandbox;
  },
  eval: (script, serial) => {
    console.log("DIRECT EVAL CALL:\n"+script+"\n");
    return instrument(script, "local");
  }
};
// Instrument //
const aran = Aran({namespace: "ADVICE"});
const instrument = (script, context) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["arrrival", "begin", "eval"], context));
module.exports = (script) => instrument(script, "global");