const Reflect_apply = global.Reflect.apply;
const RegExp_prototype_test = global.RegExp.prototype.test;

module.exports = (identifier) => (
  identifier === "new.target" ?
  "$newtarget" :
  (
    Reflect_apply(RegExp_prototype_test, ARAN.regexp, [identifier]) ?
    "$$" + identifier :
    identifier));