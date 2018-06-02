const AranLive = require("aran/live");
const sandbox = Object.create(global);
sandbox.Date = () => "APRIL FOOL";
const check_this = (strict, scope, serial) => {
  if (scope && scope.this === global)
    scope.this = sandbox;
  return scope;
};
const aranlive = AranLive({
  SANDBOX: sandbox,
  begin: check_this,
  arrival: check_this
}, {sandbox:true});
module.exports = (script, source) => aranlive.instrument(script);