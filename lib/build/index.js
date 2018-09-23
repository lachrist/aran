
const ArrayLite = require("array-lite");
const Static = require("./static.js");

const submodules = [
  require("./hoisting.js"),
  require("./protect.js"),
  require("./strictness.js"),
  require("./completion.js"),
  require("./identifier.js")
];

const Object_assign = Object.assign;
const Reflect_apply = Reflect.apply;
const String_prototype_replace = String.prototype.replace;

const keyof = (name) => "_" + Reflect_apply(String_prototype_replace, name, [/\./g, "_"])

module.exports = (format, namespace) => {
  format.Setup = () => [];
  const static = {
    save: (string, expression) => format.set(
      format.read(namespace),
      format.primitive(
        keyof(string)),
      expression),
    load: (string) => format.get(
      format.read(namespace),
      format.primitive(
        keyof(string)))
  };
  ArrayLite.forEach(
    submodules,
    (submodule) => {
      format = Object_assign({}, format, submodule(format, static));
    });
  return format;
};
