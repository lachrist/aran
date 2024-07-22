
const Reflect_apply = Reflect.apply;
const String_prototype_substring = String.prototype.substring

module.exports = (identifier) => {
  if (identifier === "@new.target")
    return "_0newtarget";
  if (identifier === "%new.target")
    return "_0newtarget";
  if (identifier === "new.target")
    return "$0newtarget";
  if (identifier[0] === "@")
    return "_" + Reflect.apply(String_prototype_substring, identifier, [1]);
  if (identifier[0] === "%")
    return "X" + Reflect.apply(String_prototype_substring, identifier, [1]);
  return "$" + identifier;
};
