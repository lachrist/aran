
const Object_prototype_toString = global.Object.prototype.toString;
const JSON_stringify = global.JSON.stringify;
const Reflect_apply = global.Reflect.apply;
const String = global.String;

module.exports = (value) => {
  if (typeof value === "string") {
    return JSON_stringify(value);
  }
  if (value !== null && (typeof value === "object" || typeof value === "function")) {
    return Reflect_apply(Object_prototype_toString, value, []);
  }
  return String(value);
};
