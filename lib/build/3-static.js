
const Object_assign = Object.assign;

const keyof = (string1, string2) => "_static_" + string1 + "_" + string2;

module.exports = (input, namespace) => Object_assign(
  {
    load: (string1, string2) => input.get(
      input.read(namespace),
      input.primitive("_static_" + string1 + string2)),
    save: (string1, string2, expression) => input.set(
      input.read(namespace),
      input.primitive("_static_" + string1 + string2),
      expression)},
  input);
