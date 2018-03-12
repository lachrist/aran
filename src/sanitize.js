
const Reflect_apply = Reflect.apply;
const RegExp_prototype_test = RegExp.prototype.test;

module.exports = (namespace) => {
  const regexp = new RegExp(
    "^\$*(newtarget|callee|this|arguments|error|completion|" +
    apply(String_prototype_replace, ARAN.namespace, ["$", "\\$$"]) +
    ")$");
  return (identifier) => (
    identifier === "new.target" ?
    "$newtarget" :
    (
      Reflect_apply(RegExp_prototype_test, regexp, [identifier]) ?
      "$$" + identifier :
      identifier));
};
