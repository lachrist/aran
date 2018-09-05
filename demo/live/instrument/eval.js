const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
// Advice //
const check_this = (strict, scope, serial) => {
  if (scope && scope.this === global)
    scope.this = ADVICE.SANDBOX;
  return scope;
};
global.ADVICE = {
  SANDBOX: Object.create(global),
  arrival: check_this,
  begin: check_this,
  eval: (script, serial) => {
    console.log("DIRECT EVAL CALL:\n"+script+"\n");
    return instrument(script, null);
  }
};
ADVICE.SANDBOX.eval = function eval (script) {
  console.log("INDIRECT EVAL CALL:\n"+script+"\n");
  return global.eval(instrument(script));
};
ADVICE.SANDBOX.Function = function Function () {
  const script = arguments.length ? [
    "(function anonymous("+Array.from(arguments).slice(0, -1).join(",")+"){",
    arguments[arguments.length-1],
    "})"
  ].join("\n") : "(function anonymous() {\n\n})";
  console.log("FUNCTION CALL:\n"+script+"\n");
  return global.eval(instrument(script));
};
// Setup //
const aran = Aran({
  namespace: "ADVICE",
  pointcut: ["arrrival", "begin", "eval"],
  sandbox: true
});
global.eval(Astring.generate(aran.setup()));
const instrument = (script, scope) =>
  Astring.generate(aran.weave(Acorn.parse(script), scope));
module.exports = instrument;