
const Reflect_apply = Reflect.apply;
const Function = global.Function;
const String_prototype_trim = String.prototype.trim;

// Credit: https://github.com/shinnn/is-var-name //

module.exports = (identifier) => {
  if (typeof identifier !== "string")
    return true;
  if (Reflect_apply(String_prototype_trim, identifier, []) !== identifier)
    return true;
  try {
    new Function(identifier, "var "+identifier);
  } catch (error) {
    return true;
  }
  return false;
};
