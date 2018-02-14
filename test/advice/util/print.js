
const String = global.String;
const String_prototype_substring = global.String.prototype.substring;
const Reflect_apply = global.Reflect.apply;
const Reflect_ownKeys = global.Reflect.ownKeys;
const JSON_stringify = global.JSON.stringify;
const Array_isArray = global.Array.isArray;

const truncate = (string) => string.length > 10 ? Reflect_apply(String_prototype_substring, string, [0, 10]) + "..." : string;

const print = (value, depth) => {
  if (!depth)
    return "...";
  if (typeof value === "string")
    return JSON_stringify(truncate(value));
  if (!value || value === true || typeof value === "number" || typeof value === "symbol")
    return String(value);
  if (typeof value === "function")
    return "function("+truncate(value.name||"")+")";
  if (Array_isArray(value)) {
    if (value.length === 0)
      return "[]";
    return "[" + print(value[0], depth-1) + (value.length === 1 ? "" : "...") + "]";
  }
  const keys = Reflect_ownKeys(value);
  if (keys.length === 0)
    return "{}";
  return "{" + JSON.stringify(truncate(keys[0])) + ":" + print(value[keys[0]], depth-1) + ((keys.length === 1) ? "" : "...") + "}";
};

module.exports = (value) => print(value, 3);
