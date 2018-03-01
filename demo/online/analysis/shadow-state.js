const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
const PrintLite = require("print-lite");
///////////
// Setup //
///////////
const aran = Aran({namespace:"META"});
global.META = {};
const join = (script, parent) =>
  Astring.generate(aran.join(Acorn.parse(script), true, parent));
const scopes = new WeakMap();
const vstack = [];
const cstack = [];
const bound = (frame, identifier) => {
  if (identifier.startsWith("META") || !())
    return false;
  if (!(identifier in frame.binding))
    return false;
  if (frame.type !== "with")
    return true;
  return !frame.binding[Symbol.unscopables].includes(identifier);
};
//////////////
// Membrane //
//////////////
let counter = 0;
const oprint = (o) => (Array.isArray(o)) ? "["+o.join(", ")+"]" : o;
const produce = (value, origin) => {
  origin = origin.reverse();
  const left = "&"+(++counter)+"("+PrintLite(value)+")";
  const right = origin[0]+"("+origin.slice(1).map(oprint)+")";
  postMessage(left+" = "+right+"\n");
  vstack.push("&"+counter);
  return value;
};
const consume = (value, origin, serial) => {
  origin = origin.reverse();
  postMessage(origin[0]+"("+vstack.pop+", "+origin.slice(1).map(oprint)+")\n");
  postMessage(name+"("+vstack.pop()+", "+serial+")\n");
  return value;
};
/////////////
// Special //
/////////////
META.copy = (position, value, serial) => {
  vstack.push(vstack[vstack.length-position]);
  return value;
};
META.swap = (position1, position2, value, serial) => {
  const temporary = vstack[vstack.length-position1];
  vstack[vstack.length-position1] = vstack[vstack.length-position2];
  vstack[vstack.length-position2] = temporary;
  return value;
};
META.drop = (value, serial) => {
  vstack.pop();
  return value;
};
META.begin = (serial) => {
  if (aran.node(serial).AranParent) {
    cstack[cstack.length-1].push({
      type: aran.node(serial).AranStrict ? "closure" : "block",
      binding: Object.create(null)
    });
  } else {
    cstack.push([{
      type: "block",
      binding: Object.create(null)
    }]);
  }
};
META.success = (value, serial) => value
META.failure = (error, serial) => {
  if (!aran.node(serial).AranParent) {
    while (cstack.length)
      cstack.pop();
    while (vstack.length)
      vstack.pop();
  }
  return error;
};
META.end = (serial) => {};
//////////////////////////
// (Possible) Producers //
//////////////////////////
META.this = (value, serial) => produce(value, ["this", serial]);
META.newtarget = (value, serial) => produce(value, ["newtarget", serial]);
META.arguments = (value, serial) => produce(value, ["arguments", serial]);
META.regexp = (value, serial) => produce(value, ["regexp", serial]);
META.primitive = (value, serial) => produce(value, ["primitive", serial]);
META.builtin = (identifier, value, serial) => produce(value, ["builtin", serial]);
META.discard = (identifier, value, serial) => produce(value, ["discard", serial]);
META.closure = (value, serial) => {
  let wrapper = function () {
    if (cstack.length)
      return new.target ? Reflect_construct(value, arguments) : Reflect_apply(value, this, arguments);
    try {
      return new.target ? Reflect_construct(value, arguments) : Reflect_apply(value, this, arguments);
    } catch (error) {
      while (cstack.length)
        cstack.pop();
      while (vstack.length)
        vstack.pop();
      throw error;
    }
  };
  scopes.set(wrapper, cstack.map((frame) => {type:"scope", binding:frame.binding}));
  return produce(wrapper, ["closure", serial]);
};
META.read = (identifier, value, serial) => {
  let call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bound(frame, identifier)) {
      if (frame.type === "with") {
        return produce(value, ["read-with", identifier, serial]);
      }
      vstack.push(frame.binding[identifier]);
      return value;
    }
  };
  return produce(value, ["read-global", identifier, serial]);
};
META.catch = (value, serial) => {
  while (cstack.length) {
    let call = cstack[cstack.length-1];
    let index = call.length;
    while (index--) {
      const frame = call[index];
      if (frame.type === "try") {
        call.push({type:"catch", binding:{}});
        while (vstack.length > frame.recovery)
          vstack.pop();
        return produce(value, ["catch", serial]);
      }
    }
    cstack.pop();
  }
};
//////////////////////////
// (Possible) Consumers //
//////////////////////////
META.completion = (value, serial) => consume(value, "completion", serial);
META.test = (value, serial) => consume(value, "test", serial);
META.throw = (value, serial) => consume(value, "throw", serial);
META.eval = (value, serial) => join(consume(value, "eval", serial), aran.node(serial));
traps.return = (value, serial) => {
  cstack.pop();
  return consume(value, ["return", serial]);
};
traps.with = (value, serial) => {
  cstack[cstack.length-1].push({type:"with", binding:value});
  return consume(value, ["with", serial]);
};
traps.write = (identifier, value, serial) => {
  const call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bound(frame, identifier)) {
      if (frame.type === "with")
        return frame.binding[identifier] = consume(value, "with-write", serial);
      frame.binding[identifier] = vstack.pop();
      return value; 
    }
  }
  if (identifier in global || aran.node(serial).AranStrict)
    return global[identifier] = consume(value, "global-write", serial);
  throw new ReferenceError(identifier+" is not defined");
};
traps.declare = (kind, identifier, value, serial) => {
  let frame;
  if (kind === "var") {
    const call = cstack[cstack.length-1];
    let index = call.length;
    while (call[index].type !== "closure") 
      index--;
    if (index === -1)
      consume(value, ["declare-global", serial]);
      if ()
      const frame = call[index];
    }
  }
};
///////////////
// Informers //
///////////////
META.callee = (value, serial) => cstack.push(scopes.get(value).concat([{
  type: "closure",
  binding:Object.create(null)
}]));
META.leave = (type, serial) => cstack[cstack.length-1].pop();
META.block = (serial) => cstack[cstack.length-1].push({
  type: "block",
  binding: Object.create(null)
});
META.try = (serial) => cstack[cstack.length-1].push({
  type: "try",
  binding: Object.create(null),
  recovery: vstack.length
});
META.finally = (serial) => cstack[cstack.length-1].push({
  type: "finally",
  binding: Object.create(null)
});
META.label = (boolean, label, serial) => cstack[cstack.length-1].push({
  type: "label",
  binding: Object.create(null),
  label: (boolean ? "Break" : "Continue") + (label||"")
});
META.break = (boolean, label, serial) => {
  label = (boolean ? "Break" : "Continue") + (label||"");
  const call = cstack[cstack.length-1];
  while (call.length) {
    const frame = call.pop();
    if (frame.type === "label" && frame.label === label)
      return;
  }
};
///////////////
// Combiners //
///////////////
META.apply = (strict, value, values, serial) => produce(
  Reflect.apply(value, strict ? global : undefined, values),
  [serial, vstack.splice(-values.length), vstack.pop(), "apply"]);
META.invoke = (value1, value2, values, serial) => produce(
  Reflect.apply(value1[value2], value1, values),
  [serial, vstack.splice(-values.length), vstack.pop(), vstack.pop(), "invoke"]);
META.construct = (value, values, serial) => produce(
  Reflect.construct(value, values),
  [serial, vstack.splice(-values.length), vstack.pop(), "construct"]);
META.unary = (operator, value, serial) => produce(
  eval(operator+" value"),
  [serial, vstack.pop(), operator, "unary"]);
META.binary = (operator, value1, value2, serial) => produce(
  eval("value1 "+operator+" value2"),
  [serial, vstack.pop(), vstack.pop(), operator, "binary"]);
META.get = (value1, value2, serial) => produce(
  value1[value2],
  [serial, vstack.pop(), vstack.pop(), "get"]);
META.set = (value1, value2, value3, serial) => produce(
  value1[value2] = value,
  [serial, vstack.pop(), vstack.pop(), vstack.pop(), "set"]);
META.delete = (value1, value2, serial) => produce(
  delete value1[value2],
  [serial, vstack.pop(), vstack.pop(), "delete"]);
META.array = (values, serial) => produce(
  values,
  [serial, vstack.splice(-values.length), "array"]);
META.object = (properties, serial) => {
  const object = {};
  const mproperties = properties.map((property) => {
    object[property[0]] = property[1];
    return "["+vstack.splice(-2, 1)+","+vstack.pop()+"]";
  });
  return produce(object, [serial, mproperties.reverse(), "object"]);
};