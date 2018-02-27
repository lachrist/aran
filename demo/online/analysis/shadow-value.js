const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
module.exports = (script) => {
  const ast1 = Acorn.parse(script);
  const ast2 = aran.join(ast1, Object.keys(META), null);
  global.eval("with(METAproxy) { "+Astring.generate(ast2)+"}");
};
global.META = {};
const aran = Aran({namespace:"META",nosetup:true});
global.eval(Astring.generate(aran.setup()));
// Membrane //
let counter = 0;
const print = (value) => {
  if (typeof value === "function")
    return "[Function " + (value.name || "anonymous") + "]";
  if (Array.isArray(value))
    return "[Array]";
  if (typeof value === "object" && value !== null)
    return "[Object]";
  if (typeof value === "string")
    return JSON.stringify(value);
  return "" + value;
};
const enter = (message, value, serial) => {
  postMessage("enter "+message+" #"+(++counter)+" "+print(value)+"\n");
  return {base:value,meta:counter};
};
const leave = (message, $value, serial) => {
  postMessage("leave "+message+" #"+$value.meta+"\n");
  return $value.base; 
};
// Environment //
let definable = null;
global.METAproxy = new Proxy(global, {
  has: (target, key) => !key.startsWith("META"),
  get: (target, key, receiver) => {
    if (key === Symbol.unscopables)
      return target[key];
    if (key in target)
      return enter("with get "+key, target[key], null);
    throw new ReferenceError(key+" is not defined");
  },
  set: (target, key, $value, receiver) => {
    const value = leave("with set "+key, $value, null);
    if (key in target)
      return target[key] = value;
    if (definable)
      return Object.defineProperty(target, key, {
        configurable: false,
        enumerable: true,
        writable: true,
        value: value
      });
    throw new ReferenceError(key+" is not defined");
  }
});
META.write = (identifier, $value, serial) => {
  definable = !aran.node(serial).AranStrict;
  return $value;
};
META.declare = (kind, identifier, $value, serial) => {
  definable = true;
  return $value;
};
// Producers //
META.builtin = (name, value, serial) => enter("builtin-"+name, value, serial);
[ "primitive",
  "regexp",
  "closure",
  "discard",
  "catch",
  "this",
  "newtarget",
  "arguments"].forEach((key) => META[key] = (value, serial) => enter(key, value, serial));
// Consumers //
META.eval = ($value, serial) => {
  value = leave("eval", $value, serial);
  return aran.join(value, Object.keys(META), aran.node(serial));
};
[ "success",
  "test",
  "throw",
  "return",
  "with"].forEach((key) => META[key] = ($value, serial) => leave(key, $value, serial));
// Combiners //
META.apply = (strict, $value, $values, serial) => {
  const value = leave("apply closure", $value, serial);
  const values = $values.map(($value, index) => leave("apply arguments "+index, $value, serial));
  return enter("apply", Reflect.apply(value, strict ? global : undefined, values), serial);
};
META.invoke = ($value1, $value2, $values, serial) => {
  const value1 = leave("invoke object", $value1, serial);
  const value2 = leave("invoke key", $value2, serial);
  const values = $values.map(($value, index) => leave("invoke arguments "+index, $value, serial));  
  return enter("invoke", Reflect.apply(value1[value2], value1, values), serial);
};
META.construct = ($value, $values, serial) => {
  const value = leave("construct closure", $value, serial);
  const values = $values.map((value, index) => leave("invoke arguments "+index, $value, serial));
  return enter("construct", Reflect.construct(value, values), serial);
};
META.unary = (operator, $value, serial) => {
  const value = leave("unary "+operator, $value, serial);
  return enter("unary", eval(operator+" value"), serial);
};
META.binary = (operator, $value1, $value2, serial) => {
  const value1 = leave("binary "+operator+" left", $value1, serial);
  const value2 = leave("binary "+operator+" right", $value2, serial);
  return enter("binary", eval("value1 "+operator+" value2"));
};
META.get = ($value1, $value2, serial) => {
  const value1 = leave("get object", $value1, serial);
  const value2 = leave("get key", $value2, serial);
  return enter("get", value1[value2], serial);
};
META.set = ($value1, $value2, $value3, serial) => {
  const value1 = leave("set object", $value1, serial);
  const value2 = leave("set key", $value2, serial);
  const value3 = leave("set value", $value3, serial);
  value1[value2] = value3
  return $value3;
};
META.delete = ($value1, $value2, serial) => {
  const value1 = leave("delete object", $value1, serial);
  const value2 = leave("delete key", $value2, serial);
  return enter("delete", delete value1[value2], serial);
};
META.array = ($values, serial) => {
  const values = $values.map(($value, index) => leave("elements "+index, value, serial));
  return enter("array", values, serial);
};
META.object = ($properties, serial) => {
  return enter("object", $properties.reduce((object, $property, index) => {
    const key = leave("object key "+index, $property[0], serial);
    const value = leave("object value "+index, $property[1], serial);
    object[key] = value;
    return object;
  }, {}), serial);
};