
const Reflect_apply = Reflect.apply;
const String_prototype_substring = String.prototype.substring;

exports.split = (label) => label[0] === "b" || label[0] === "B";

exports.core = (label) => (
  label[0] === "B" || label[0] === "C" ?
  null :
  Reflect_apply(String_prototype_substring, label, [1]));
