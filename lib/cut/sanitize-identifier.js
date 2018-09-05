const Reflect_apply = global.Reflect.apply;
const RegExp_prototype_test = global.RegExp.prototype.test;
const String_prototype_replace = global.String.prototype.replace;

module.exports = (identifier) => (
  identifier === "new.target" ?
  "$newtarget" :
  (
    Reflect_apply(
      RegExp_prototype_test,
      new RegExp(
        "^\\$*(newtarget|callee|this|arguments|error|completion|eval|scope|" +
        Reflect_apply(String_prototype_replace, ARAN.namespace, ["$", "\\$$"]) +
        ")$"),
      [
        identifier]) ?
    "$$" + identifier :
    identifier));