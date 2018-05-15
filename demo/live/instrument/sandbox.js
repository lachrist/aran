const AranLive = require("aran/live");
const sandbox = Object.create(global);
sandbox.Date = () => "APRIL FOOL";
module.exports = AranLive({
  SANDBOX: sandbox,
  begin: (strict, direct, value) => sandbox,
  arrival: (strict, arrival, values) => {
    if (arrival.this === global)
      arrival.this = sandbox;
    return arrival;
  }
}, {sandbox:true}).instrument;