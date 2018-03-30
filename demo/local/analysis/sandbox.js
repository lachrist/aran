const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
let META = {};
const aran = Aran({namespace:"META", sandbox:true});
{
  let sandbox = {
    TypeError: TypeError,
    ReferenceError: ReferenceError,
    Object: Object,
    Reflect: Reflect,
    Symbol: Symbol,
    console: console,
    eval: eval,
    Math: Math
  };
  sandbox.global = sandbox;
  eval(Astring.generate(aran.setup()));
}
module.exports = (script) =>
  eval(Astring.generate(aran.weave(Acorn.parse(script), false, null)));
