const Aran = require("aran");
const AranLive = require("aran-live");
const sandbox = Object.create(global);
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
  return global.eval(instrument(script));
};
const check_this = (strict, scope, serial) => {
  if (scope && scope.this === global)
    scope.this = sandbox;
  return scope;
};
const instrument = AranLive(Aran({sandbox:true}), {
  SANDBOX: sandbox,
  arrival: check_this,
  begin: check_this,
  eval: (script, serial) => {
    console.log("DIRECT EVAL CALL:\n"+script+"\n");
    return instrument(script, serial);
  }
});
module.exports = (script, source) => instrument(script);