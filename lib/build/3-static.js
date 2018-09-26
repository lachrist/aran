
const Object_assign = Object.assign;
const Reflect_apply = Reflect.apply;
const String_prototype_replace = String.prototype.replace;

const keyof = (name) => "_static_" + Reflect_apply(String_prototype_replace, name, [/\./g, "_"])

module.exports = (format, namespace) => Object_assign(
  {
    load: (string) => format.get(
      format.read(namespace),
      format.primitive(
        keyof(string))),
    save: (string, expression) => format.set(
      format.read(namespace),
      format.primitive(
        keyof(string)),
      expression)},
  format);
