const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");

global.META = {};
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
const consume = (name, infos, value, serial) => {
  console.log(name+"("+infos.concat([vstack.pop()]).join(", ")+", @"+serial+")");
  return value;
};
const produce = (name, infos, value, serial) => {
  const right = name+"("+infos.concat([print(value)]).join(", ")+", @"+serial+")";
  console.log("#"+(++counter)+" = "+right);
  vstack.push("&"+counter);
  return value;
};
const combine = (value, name, infos, serial) => {
  const right = name+"("+infos.reverse().join(", ")+", @"+serial+")";
  console.log("#"+(++counter)+"["+print(value)+"] = "+right);
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
META.primitive = (value, serial) =>
  produce("primitive", [], value, serial);
META.regexp = (value, serial) =>
  produce("regexp", [], value, serial);
META.load = (name, value, serial) =>
  produce("load", ["'"+name+"'"], value, serial);
META.discard = (identifier, value, serial) =>
  produce("discard", ["'"+identifier+"'"], value, serial);
META.function = (value, serial) => {
  let wrapper = function () {
    if (cstack.length)
      return new.target ?
        Reflect.construct(value, arguments) :
        Reflect.apply(value, this, arguments);
    try {
      return new.target ?
        Reflect.construct(value, arguments) :
        Reflect.apply(value, this, arguments);
    } catch (error) {
      while (cstack.length)
        cstack.pop();
      while (vstack.length)
        vstack.pop();
      throw error;
    }
  };
  Object.defineProperty(wrapper, "name", {value:value.name, configurable:true});
  Object.defineProperty(wrapper, "length", {value:value.length, configurable:true});
  wrapper.prototype = value.prototype || {constructor:wrapper};
  scopes.set(value, cstack[cstack.length-1].slice());
  return produce("function", [], wrapper, serial);
};
META.read = (identifier, value, serial) => {
  let call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bind(frame, identifier)) {
      if (frame.type === "with")
        return produce("read", ["'"+identifier+"'"], value, null);
      vstack.push(frame.binding[identifier]);
      return value;
    }
  };
  return produce("read", ["'"+identifier+"'"], value, null);
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
META.success = (strict, direct, value, serial) => {
  vstack.push(estack.pop());
  return direct ? value : consume("success", [], value, serial);
};
META.failure = (strict, direct, error, serial) => {
  estack.pop();
  if (!direct) {
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
META.save = (name, value, serial) =>
  consume("save", ["'"+name+"'"], value, serial);
META.throw = (value, serial) =>
  consume("throw", [], value, serial);
META.test = (value, serial) =>
  consume("test", [], value, serial);
META.eval = (value, serial) =>
  instrument(consume("eval", [], value, serial), serial);
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
        return consume("write", ["'"+identifier+"'"], value, null);
      frame.binding[identifier] = vstack.pop();
      return value;
    }
  }
  return consume("write", ["'"+identifier+"'"], value, null);
};
META.declare = (kind, identifier, value, serial) => {
  const call = cstack[cstack.length-1];
  let frame = call[call.length-1];
  if (kind === "var") {
    let index = call.length-1;
    while (call[index].type !== "function") {
      if (!index)
        return consume("declare", ["'var'", "'"+identifier+"'"], value, null);
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
META.begin = (strict, direct, serial) => {
  estack.push(null);
  if (direct) {
    cstack[cstack.length-1].push({
      type: strict ? "function" : "block",
      binding: Object.create(null)
    });
  } else {
    cstack.push([{
      type: "block",
      binding: Object.create(null)
    }]);
  }
};
META.end = (strict, direct, serial) => {};
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
META.arrival = (strict, value1, value2, value3, value4, serial) => {
  cstack.push(scopes.get(value1).concat([{
    type: "function",
    binding: Object.create(null)
  }]));
  return [
    produce("arrival-callee", [], value1, serial),
    produce("arrival-new", [], value2, serial),
    produce("arrival-this", [], value3, serial),
    produce("arrival-arguments", [], value4, serial)
  ];
};
META.apply = (strict, value1, values, serial) => combine(
  Reflect.apply(value1, strict ? undefined : global, values),
  "apply", [cut(values.length), vstack.pop(), String(strict)], serial);
META.invoke = (value1, value2, values, serial) => combine(
  Reflect.apply(value1[value2], value1, values),
  "invoke", [cut(values.length), vstack.pop(), vstack.pop()], serial);
META.construct = (value, values, serial) => combine(
  Reflect.construct(value, values),
  "construct", [cut(values.length), vstack.pop()], serial);
META.unary = (operator, value, serial) => combine(
  eval(operator+" value"),
  "unary", [vstack.pop(), "'"+operator+"'"], serial);
META.binary = (operator, value1, value2, serial) => combine(
  eval("value1 "+operator+" value2"),
  "binary", [vstack.pop(), vstack.pop(), "'"+operator+"'"], serial);
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

///////////
// Setup //
///////////
// To output the same result as shadow-value, the sandbox must be activated 
const aran = Aran({namespace:"META", sandbox:true});
global.eval(Astring.generate(aran.setup(true)));
const instrument = (script, parent) =>
  Astring.generate(aran.weave(Acorn.parse(script), true, parent));
module.exports = (script) => global.eval(instrument(script));