const Aran = require("aran");
const AranLive = require("aran-live");
const sandbox = Object.create(global);
sandbox.Date = () => "APRIL FOOL";
const check_this = (strict, scope, serial) => {
  if (scope && scope.this === global)
    scope.this = sandbox;
  return scope;
};
const instrument = AranLive(Aran({sandbox:true}), {
  SANDBOX: sandbox,
  begin: check_this,
  arrival: check_this
});
module.exports = (script, source) => instrument(script);