const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
// Sandbox //
const sandbox = {};
sandbox.self = sandbox;
sandbox.global = sandbox;
sandbox.window = sandbox;
sandbox.Date = () => "APRIL FOOL";
Object.setPrototypeOf(sandbox, global);
// Advice //
global.ADVICE = {
  program: (scope, global, serial) => {
    if (scope.this === global)
      scope.this = sandbox;
    return sandbox;
  },
  arrival: (scope, arguments, serial) => {
    if (scope.this === global)
      scope.this = sandbox;
    return arguments;
  }
};
// Instrument //
const aran = Aran({namespace: "ADVICE"});
module.exports = (script) =>
  Astring.generate(aran.weave(Acorn.parse(script), ["program", "arrival"]));