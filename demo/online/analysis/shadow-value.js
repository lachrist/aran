const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const PrintLite = require("print-lite");
///////////
// Setup //
///////////
const aran = Aran({namespace:"META", nosetup:true});
global.eval(Astring.generate(aran.setup()));
global.META = {};
const join = (script, parent) =>
  Astring.generate(aran.join(Acorn.parse(script), Object.keys(META), parent));
module.exports = (script) => eval("with (gproxy) { "+join(script, null)+"}");
//////////////
// Membrane //
//////////////
let counter = 0;
const reference = (name, parts) => {
  postMessage("#"+(++counter)+" = "+name+"("+parts.map(String).join(", ")+");");
  return counter;
};


const metaof = ($value) => $value.meta;
const baseof = ($value) => $value.base;
const oprint = (o) => (Array.isArray(o)) ? "["+o.map(String).join(", ")+"]" : String(o);
const produce = (value, origin) => {
  const left = "&"+(++counter)+"("+PrintLite(value)+")";
  const right = origin[0]+"("+origin.slice(1).map(oprint).join(", ")+")";
  postMessage(left+" = "+right+"\n");
  return {base:value,meta:"&"+counter};
};
const consume = ($value, name, serial) => {
  postMessage(name+"("+$value.meta+", "+serial+")\n");
  return $value.base;
};
const combine = ($value, name, origin) => {};
const produce = (value, name, origin) => {};
const consume = ()
/////////////////
// Environment //
/////////////////
let set = null;
let get = null;
const handlers = {
  has: (target, key) => !key.startsWith("META") && (key in target.base),
  deleteProperty: (target, key) => delete target.base[key],
  get: (target, key, receiver) => {
    if (key === Symbol.unscopables)
      return target.base[Symbol.unscopables];
    get = "with";
    return target.base[key];
  },
  set: (target, key, $value, receiver) => {
    target.base[key] = consume($value, "with-write-"+key, set.serial);
    set = null;
  }
};
const gproxy = new Proxy(produce(global, ["global", 0]), {
  has: (target, key) => !key.startsWith("META"),
  deleteProperty: (target, key) => delete target.base[key],
  get: (target, key, receiver) => {
    if (key === Symbol.unscopables)
      return undefined;
    if (!(key in target.base))
      throw new ReferenceError(key+" is not defined");
    get = "global";
    return target.base[key];
  },
  set: (target, key, $value, receiver) => {
    if (!(key in target) && set.write && aran.node(set.serial).AranStrict)
      throw new ReferenceError(key+" is not defined");
    if (key in target || set.write) {
      target.object[key] = consume($value, "with-write-"+key, set.serial);
    } else {
      Object.defineProperty(target, key, {
        configurable: false,
        enumerable: true,
        writable: true,
        value: consume($value, "with-declare-"+key, set.serial)
      });
    }
  }
});
META.with = ($value, serial) => new Proxy($value, handlers);
META.read = (identifier, $value, serial) => {
  if (get) {
    $value = produce($value, ["with-read-"+identifier, serial]);
    get = false;
  }
  return $value
};
META.write = (identifier, $value, serial) => {
  set = {write:true, serial:serial};
  return $value;
};
META.declare = (kind, identifier, $value, serial) => {
  set = {write:false, serial:serial};
  return $value;
};
META.eval = ($value, serial) => join(consume("eval")($value, serial));
///////////////
// Producers //
///////////////
["builtin", "primitive", "regexp", "closure", "discard", "this", "newtarget", "arguments", "catch"].forEach((name) => {
  META[key] = function () {
    return {
      base: arguments[arguments.length-2],
      meta: equation(name, arguments)
    };
  }
});
META.builtin = (name, value, serial) => produce(value, ["builtin", name, serial]);
META.primitive = (value, serial) => produce(value, ["primitive", serial]);
META.regexp = (value, serial) => produce(value, ["regexp", serial]);
META.closure = (value, serial) => produce(value, ["closure", serial]);
META.discard = (identifier, value, serial) => produce(value, ["discard", identifier, serial]);
META.this = (value, serial) => produce(value, ["this", serial]);
META.newtarget = (value, serial) => produce(value, ["newtarget", serial]);
META.arguments = (value, serial) => produce(value, ["arguments", serial]);
META.catch = (value, serial) => produce(value, ["catch", serial]);
///////////////
// Consumers //
///////////////
const consume = (name) => function () {
  const $value = arguments[arguments.length-2];
  arguments[arguments.length-2] = $value.meta;
  equation(name, arguments);
  return $value.base;
};
META.success = consume("success");
META.test = consume("test");
META.throw = consume("throw");
META.return = consume("return");
///////////////
// Combiners //
///////////////
const combine = (name, value, array) => 
META.apply = (strict, $value, $values, serial) => produce(
  Reflect.apply($value.base, strict ? global : undefined, $values.map(baseof)),
  ["apply", strict, $value.meta, $values.map(metaof), serial])
META.invoke = ($value1, $value2, $values, serial) => produce(
  Reflect.apply($value1.base[$value2.base], $value1.base, $values.map(baseof)),
  ["invoke", $value1.meta, $value2.meta, $values.map(metaof), serial]);
META.construct = ($value, $values, serial) => produce(
  Reflect.construct($value.base, $values.map(baseof)),
  ["construct", $value.meta, $values.map(metaof), serial]);
META.unary = (operator, $value, serial) => produce(
  eval(operator+" $value.base"),
  ["unary", operator, $value.meta, serial]);
META.binary = (operator, $value1, $value2, serial) => produce(
  eval("$value1.base "+operator+" $value2.base"),
  ["binary", operator, $value1.meta, $value2.meta, serial]);
META.get = ($value1, $value2, serial) => produce(
  $value1.base[$value2.base],
  ["get", $value1.meta, $value2.meta, serial]);
META.set = ($value1, $value2, $value3, serial) => produce(
  $value1.base[$value2.base] = $value3.base,
  ["set", $value1.meta, $value2.meta, $value3.meta, serial]);
META.delete = ($value1, $value2, serial) => produce(
  delete $value1.base[$value2.base],
  ["delete", $value1.meta, $value2.meta, serial]);
META.array = ($values, serial) => produce(
  $values.map(baseof),
  ["array", $values.map(metaof), serial]);
META.object = ($properties, serial) => {
  const object = {};
  const mproperties = $properties.map(($property) => {
    object[$property[0].base] = $property[1].base;
    return "["+$property[0].meta+","+$property[1].meta+"]";
  });
  return produce(object, ["object", mproperties, serial]);
};