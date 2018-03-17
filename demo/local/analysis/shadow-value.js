const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const PrintLite = require("print-lite");
//////////////
// Membrane //
//////////////
let counter = 0;
const wrappers = new WeakSet();
const consume = (name, infos, $value, serial) => {
  postMessage(name+"("+infos.concat([$value.meta, serial]).join(", ")+")\n");
  return $value.base;
};
const produce = (name, infos, value, serial) => {
  const right = name+"("+infos.concat([PrintLite(value), serial]).join(", ")+")";
  postMessage("#"+(++counter)+" = "+right+"\n");
  const wrapper = {meta:"&"+counter, base:value};
  wrappers.add(wrapper);
  return wrapper;
};
const combine = (value, name, infos, serial) => {
  const right = name+"("+infos.join(", ")+", "+serial+")";
  postMessage("#"+(++counter)+"["+PrintLite(value)+"] = "+right+"\n");
  const wrapper = {meta:"&"+counter, base:value};
  wrappers.add(wrapper);
  return wrapper;
};
///////////
// Setup //
///////////
const aran = Aran({namespace:"META"});
let META = {};
const handlers = {
  set: (target, key, $value, receiver) => {
    target[key] = consume("write", [key], $value, 0);
  },
  defineProperty: (target, key, descriptor) => {
    descriptor.value = consume("declare", ["var", key], descriptor.value, 0);
    return Reflect.defineProperty(target, key, descriptor);
  }
};
(function () {
  let global = new Proxy(this, handlers);
  eval(Astring.generate(aran.setup()));
} ());
const weave = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), Object.keys(META), parent));
module.exports = (script) => eval(weave(script, null));
const metaof = ($value) => $value.meta;
const baseof = ($value) => $value.base;
///////////////
// Consumers //
///////////////
["test", "throw", "return"].forEach((name) => {
  META[name] = ($value, serial) => consume(name, [], $value, serial);
});
META.success = ($value, serial) =>
  aran.node(serial).AranParent ? $value : consume("success", [], $value, serial);
META.with = ($value, serial) =>
  new Proxy(consume("with", [], $value, serial), handlers);
META.eval = ($value, serial) =>
  weave(consume("eval", [], $value, serial), aran.node(serial));
///////////////
// Producers //
///////////////
["primitive", "regexp", "closure", "this", "arguments", "catch"].forEach((name) => {
  META[name] = (value, serial) => produce(name, [], value, serial);
});
META.discard = (identifier, value, serial) =>
  produce("discard", [identifier], value, serial);
META.builtin = (name, value, serial) =>
  produce("builtin", [name], value, serial);
META.callee = ($value, serial) =>
  produce("callee", [], $value.base, serial);
META.read = (identifier, value, serial) =>
  wrappers.has(value) ? value : produce("read", [identifier], value, serial);
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
  "unary", [operator, $value.meta], serial);
META.binary = (operator, $value1, $value2, serial) => combine(
  eval("$value1.base "+operator+" $value2.base"),
  "binary", [operator, $value1.meta, $value2.meta], serial);
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