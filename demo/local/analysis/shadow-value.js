const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
//////////////
// Membrane //
//////////////
const print = (value) => {
  if (typeof value === "function")
    return "function";
  if (typeof value === "object")
    return value ? "object" : "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};
let counter = 0;
const consume = (name, infos, $value, serial) => {
  console.log(name+"("+infos.concat([$value.meta]).join(", ")+", @"+serial+")");
  return $value.base;
};
const produce = (name, infos, value, serial) => {
  const right = name+"("+infos.concat([print(value)]).join(", ")+", @"+serial+")";
  console.log("#"+(++counter)+" = "+right);
  return {meta:"&"+counter, base:value};
};
const combine = (value, name, infos, serial) => {
  const right = name+"("+infos.join(", ")+", @"+serial+")";
  console.log("#"+(++counter)+"["+print(value)+"] = "+right);
  return {meta:"&"+counter, base:value};
};
///////////
// Setup //
///////////
const aran = Aran({namespace:"META", sandbox:true});
let META = {};
const handlers = {};
global.global = global;
let sandbox = new Proxy(global, handlers);
eval(Astring.generate(aran.setup()));
handlers.get = (target, key, receiver) => typeof key === "symbol" ?
  target[key] :
  produce("read", ["'"+key+"'"], target[key], 0);
handlers.set = (target, key, $value, receiver) => {
  target[key] = consume("write", ["'"+key+"'"], $value, 0);
};
handlers.defineProperty = (target, key, descriptor) => {
  descriptor.value = consume("declare", ["'var'", "'"+key+"'"], descriptor.value, 0);
  return Reflect.defineProperty(target, key, descriptor);
};
const weave = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), Object.keys(META), parent));
module.exports = (script) => eval(weave(script, null));
const metaof = ($value) => $value.meta;
const baseof = ($value) => $value.base;
///////////////
// Consumers //
///////////////
META.test = ($value, serial) =>
  consume("test", [], $value, serial);
META.throw = ($value, serial) =>
  consume("throw", [], $value, serial);
META.return = ($value, serial) =>
  consume("return", [], $value, serial);
META.success = ($value, serial) =>
  aran.node(serial).AranParent ? $value : consume("success", [], $value, serial);
META.with = ($value, serial) =>
  new Proxy(consume("with", [], $value, serial), handlers);
META.eval = ($value, serial) =>
  weave(consume("eval", [], $value, serial), aran.node(serial));
///////////////
// Producers //
///////////////
META.primitive = (value, serial) =>
  produce("primitive", [], value, serial);
META.regexp = (value, serial) =>
  produce("regexp", [], value, serial);
META["function"] = (value, serial) =>
  produce("function", [], value, serial);
META.catch = (value, serial) =>
  produce("catch", [], value, serial);
META.discard = (identifier, value, serial) =>
  produce("discard", ["'"+identifier+"'"], value, serial);
META.builtin = (name, value, serial) =>
  produce("builtin", ["'"+name+"'"], value, serial);
META.arrival = (value, serial) => {
  value.callee = value.callee.base;
  if (!aran.node(serial).AranStrict)
    value.arguments.callee = value.callee;
  return produce("arrival", [], value, serial);
};
///////////////
// Combiners //
///////////////
META.apply = (strict, $value, $values, serial) => combine(
  Reflect.apply($value.base, strict ? global : undefined, $values.map(baseof)),
  "apply", [String(strict), $value.meta, "["+$values.map(metaof)+"]"], serial);
META.invoke = ($value1, $value2, $values, serial) => combine(
  Reflect.apply($value1.base[$value2.base], $value1.base, $values.map(baseof)),
  "invoke", [$value1.meta, $value2.meta, "["+$values.map(metaof)+"]"], serial);
META.construct = ($value, $values, serial) => combine(
  Reflect.construct($value.base, $values.map(baseof)),
  "construct", [$value.meta, "["+$values.map(metaof)+"]"], serial);
META.unary = (operator, $value, serial) => combine(
  eval(operator+" $value.base"),
  "unary", ["'"+operator+"'", $value.meta], serial);
META.binary = (operator, $value1, $value2, serial) => combine(
  eval("$value1.base "+operator+" $value2.base"),
  "binary", ["'"+operator+"'", $value1.meta, $value2.meta], serial);
META.get = ($value1, $value2, serial) => combine(
  $value1.base[$value2.base],
  "get", [$value1.meta, $value2.meta], serial);
META.set = ($value1, $value2, $value3, serial) => combine(
  $value1.base[$value2.base] = $value3.base,
  "set", [$value1.meta, $value2.meta, $value3.meta], serial);
META.delete = ($value1, $value2, serial) => combine(
  delete $value1.base[$value2.base],
  "delete", [$value1.meta, $value2.meta], serial);
META.array = ($values, serial) => combine(
  $values.map(baseof),
  "array", ["["+$values.map(metaof)+"]"], serial);
META.object = ($properties, serial) => {
  const object = {};
  const mproperties = $properties.map(($property) => {
    object[$property[0].base] = $property[1].base;
    return "["+$property[0].meta+","+$property[1].meta+"]";
  });
  return combine(object, "object", ["["+mproperties+"]"], serial);
};