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
module.exports = (script) => eval(join(script, null));
const scopes = new WeakMap();
const vstack = [];
const estack = [];
const cstack = [];
const bind = (frame, identifier) => {
  if (identifier.startsWith("META"))
    return false;
  if (!(identifier in frame.binding))
    return false;
  if (frame.type !== "with")
    return true;
  const unscopables = frame.binding[Symbol.unscopables];
  return unscopables && unscopables.includes(identifier);
};
let counter = 0;
const consume = (name, infos, value, serial) => {
  postMessage(name+"("+infos.concat([vstack.pop(), serial]).join(", ")+")\n");
  return value;
};
const produce = (name, infos, value, serial) => {
  postMessage("#"+(++counter)+" = "+name+"("+infos.concat([PrintLite(value), serial]).join(", ")+")\n");
  vstack.push("&"+counter);
  return value;
};
const combine = (value, name, infos, serial) => {
  postMessage("#"+(++counter)+"["+PrintLite(value)+"] = "+name+"("+infos.reverse().concat([serial]).join(", ")+")\n");
  vstack.push("&"+counter);
  return value;
};
//////////////
// Chaining //
//////////////
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
///////////////
// Producers //
///////////////
["primitive", "regexp", "closure", "this", "arguments", "catch"].forEach((name) => {
  META[name] = (value, serial) => produce(name, [], value, serial);
});
META.callee = (value, serial) => {
  cstack.push(scopes.get(value).concat([{
    type: "closure",
    binding: Object.create(null)
  }]));
  return produce("callee", [], value, serial);
};
META.builtin = (name, value, serial) => produce("builtin", [name], value, serial);
META.discard = (identifier, value, serial) => produce("discard", [identifier], value, serial);
META.closure = (value, serial) => {
  let wrapper = function () {
    if (cstack.length)
      return new.target ? Reflect.construct(value, arguments) : Reflect.apply(value, this, arguments);
    try {
      return new.target ? Reflect.construct(value, arguments) : Reflect.apply(value, this, arguments);
    } catch (error) {
      while (cstack.length)
        cstack.pop();
      while (vstack.length)
        vstack.pop();
      throw error;
    }
  };
  delete wrapper.name;
  scopes.set(wrapper, cstack[cstack.length-1].slice());
  return produce("closure", [], wrapper, serial);
};
META.read = (identifier, value, serial) => {
  let call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bind(frame, identifier)) {
      if (frame.type === "with")
        return produce("read", [identifier], value, 0);
      vstack.push(frame.binding[identifier]);
      return value;
    }
  };
  return produce("read", [identifier], value, 0);
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
        return produce("catch", [], value, serial);
      }
    }
    cstack.pop();
  }
};
///////////////
// Consumers //
///////////////
META.with = (value, serial) => {
  cstack[cstack.length-1].push({type:"with", binding:value});
  return consume("with", [], value, serial);
};
META.success = (value, serial) => {
  vstack.push(estack.pop());
  return aran.node(serial).AranParent ? value : consume("success", [], value, serial);
};
META.failure = (error, serial) => {
  estack.pop();
  if (!aran.node(serial).AranParent) {
    while (cstack.length)
      cstack.pop();
    while (vstack.length)
      vstack.pop();
  }
  return error;
};
META.completion = (value, serial) => {
  estack[estack.length-1] = vstack.pop();
  return value;
};
META.throw = (value, serial) => consume("throw", [], value, serial);
META.test = (value, serial) => consume("test", [], value, serial);
META.eval = (value, serial) => join(consume("eval", [], value, serial), aran.node(serial));
META.return = (value, serial) => {
  cstack.pop();
  return consume("return", [], value, serial);
};
META.write = (identifier, value, serial) => {
  const call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bind(frame, identifier)) {
      if (frame.type === "with")
        return consume("write", [identifier], value, 0);
      frame.binding[identifier] = vstack.pop();
      return value;
    }
  }
  return consume("write", [identifier], value, 0);
};
META.declare = (kind, identifier, value, serial) => {
  const call = cstack[cstack.length-1];
  let frame = call[call.length-1];
  if (kind === "var") {
    let index = call.length-1;
    while (call[index].type !== "closure") {
      if (!index)
        return consume("declare", ["var", identifier], value, 0);
      index--;
    }
    frame = call[index];
  }
  Object.defineProperty(frame.binding, identifier, {
    configurable: kind === "var",
    writable: kind !== "const",
    enumerable: true,
    value: vstack.pop()
  });
  return value;
};
///////////////
// Informers //
///////////////
META.begin = (serial) => {
  estack.push(null);
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
META.end = (serial) => {};
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
const cut = (length) => length ? "["+vstack.splice(-length) +"]" : "[]";
META.apply = (strict, value, values, serial) => combine(
  Reflect.apply(value, strict ? global : undefined, values),
  "apply", [cut(values.length), vstack.pop(), String(strict)], serial);
META.invoke = (value1, value2, values, serial) => combine(
  Reflect.apply(value1[value2], value1, values),
  "invoke", [cut(values.length), vstack.pop(), vstack.pop()], serial);
META.construct = (value, values, serial) => combine(
  Reflect.construct(value, values),
  "construct", [cut(values.length), vstack.pop()], serial);
META.unary = (operator, value, serial) => combine(
  eval(operator+" value"),
  "unary", [vstack.pop(), operator], serial);
META.binary = (operator, value1, value2, serial) => combine(
  eval("value1 "+operator+" value2"),
  "binary", [vstack.pop(), vstack.pop(), operator], serial);
META.get = (value1, value2, serial) => combine(
  value1[value2],
  "get", [vstack.pop(), vstack.pop()], serial);
META.set = (value1, value2, value3, serial) => combine(
  value1[value2] = value3,
  "set", [vstack.pop(), vstack.pop(), vstack.pop()], serial);
META.delete = (value1, value2, serial) => combine(
  delete value1[value2],
  "delete", [vstack.pop(), vstack.pop()], serial);
META.array = (values, serial) => combine(
  values,
  "array", [cut(values.length)], serial);
META.object = (properties, serial) => {
  const object = {};
  const mproperties = properties.map((property) => {
    object[property[0]] = property[1];
    return "["+vstack.splice(-2, 1)+","+vstack.pop()+"]";
  });
  return combine(object, "object", ["["+mproperties.reverse()+"]"], serial);
};