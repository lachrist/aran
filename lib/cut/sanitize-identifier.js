const Reflect_call = global.Reflect.call;
const RegExp_prototype_test = global.RegExp.prototype.test;

module.exports = (identifier) => (
  identifier === "new.target" ?
  "$newtarget" :
  (
    Reflect_call(
      RegExp_prototype_test,
      new RegExp(
        "^\\$*(newtarget|callee|this|arguments|error|completion|eval|scope|" +
        Reflect_apply(String_prototype_replace, (options.namespace||"__ARAN__"), ["$", "\\$$"]) +
        ")$"),
      identifier) ?
    "$$" + identifier :
    identifier));