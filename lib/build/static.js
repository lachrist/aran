
const keyof = (name) => {
  let key = "";
  for (let index = 0; index < name.length; index++)
    key += name[index] === "." ? "_" : name[index];
  return "_"+key;
};

module.exports = (format, namespace) => ({
  save: (string, expression) => format.set(
    format.read(namespace),
    format.primitive(
      keyof(string)),
    expression),
  load: (string) => format.get(
    format.read(namespace),
    format.primitive(
      keyof(string)))});
