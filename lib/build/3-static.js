
const Object_assign = Object.assign;
const Reflect_apply = Reflect.apply;
const String_prototype_replace = String.prototype.replace;

const keyof = (name) => "_static_" + Reflect_apply(String_prototype_replace, name, [/\./g, "_"])

module.exports = (input, namespace) => Object_assign(
  {
    load: (string) => input.get(
      input.read(namespace),
      input.primitive(
        keyof(string))),
    save: (string, expression) => input.set(
      input.read(namespace),
      input.primitive(
        keyof(string)),
      expression)},
  input);
