
const ArrayLite = require("array-lite");
const Reflect_apply = Reflect.apply;
const String_prototype_split = String.prototype.split;
const JSON_stringify = JSON.stringify;
const Error = global.Error;

const regular1s = [
  "Object",
  "eval",
  "Proxy",
  "ReferenceError",
  "TypeError"
];

const regular2s = [
  "Symbol.iterator",
  "Reflect.apply",
  "Reflect.set",
  "Reflect.get",
  "Reflect.deleteProperty",
  "Reflect.defineProperty",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys"
];

const irregulars = ["global"];

const builtins = ArrayLite.concat(regular1s, regular2s, irregulars);

module.exports = (format, static) => ({
  builtin: (string) => {
    if (ArrayLite.includes(builtins, string)) {
      return static.load(string),
    } else {
      throw new Error("Unsupported builtin: "+string+", should be one of:"+JSON_stringify(names));
    }
  },
  Setup: () => ArrayLite.concat(
    format.Setup(),
    ArrayLite.flatenMap(
      regular1s,
      (name) => format.Statement(
        static.save(
          name,
          format.read(name)))), 
    ArrayLite.flatenMap(
      regular2s,
      (name) => format.Statement(
        static.save(
          name,
          format.get(
            format.read(Reflect_apply(String_prototype_split, name, ["."])[0]),
            format.primitive(Reflect_apply(String_prototype_split, name, ["."])[1]))))),
    format.Statement(
      static.save(
        "global",
        format.apply(
          static.load("eval"),
          [
            format.primitive("this")]))))});
