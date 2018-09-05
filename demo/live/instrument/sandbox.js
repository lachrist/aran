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
  begin: check_this,
  arrival: check_this
};
ADVICE.SANDBOX.Date = () => "APRIL FOOL";
// Setup //
const aran = Aran({
  namespace: "ADVICE",
  sandbox: true,
  pointcut: ["begin", "arrival"]});
global.eval(Astring.generate(aran.setup()));
module.exports = (script) =>
  Astring.generate(aran.weave(Acorn.parse(script)));