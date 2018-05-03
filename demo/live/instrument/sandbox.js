const AranLive = require("aran/live");
const sandbox = Object.create(global);
sandbox.Date = () => "APRIL FOOL";
module.exports = AranLive({
  SANDBOX: sandbox,
  begin: (strict, direct, value) => sandbox,
  arrival: (strict, callee, isnew, value, values) => [
    callee,
    isnew,
    value === global ? sandbox : value,
    values
  ]
}, {sandbox:true}).instrument;