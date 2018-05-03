const AranLive = require("aran/live");
const sandbox = Object.create(global);
sandbox.eval = function eval (script) {
  console.log("INDIRECT EVAL CALL:\n"+script+"\n");
  return global.eval(module.exports(script));
};
sandbox.Function = function Function () {
  const script = arguments.length ? [
    "(function anonymous("+Array.from(arguments).slice(0, -1).join(",")+"){",
    arguments[arguments.length-1],
    "})"
  ].join("\n") : "(function anonymous() {\n\n})";
  console.log("FUNCTION CALL:\n"+script+"\n");
  return global.eval(module.exports(script));
};
module.exports = AranLive({
  SANDBOX: sandbox,
  eval: (script, serial) => {
    console.log("DIRECT EVAL CALL:\n"+script+"\n");
    return module.exports(script, serial);
  },
  arrival: (strict, callee, isnew, value, values, serial) => [
    callee,
    isnew,
    value === global ? sandbox : value,
    values 
  ],
  begin: (strict, direct, value) => sandbox,
}, {sandbox:true}).instrument;