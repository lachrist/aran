const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");

///////////
// State //
///////////
const scopes = new WeakMap();
const vstack = [];
const estack = [];
const cstack = [];
const saving = {};

/////////////
// Helpers //
/////////////
const bind = (frame, identifier) => {
  if (!(identifier in frame.binding))
    return false;
  if (frame.type !== "with")
    return true;
  return !(frame.binding[Symbol.unscopables] || []).includes(identifier);
};

const cleanup = () => {
  while (cstack.length)
    cstack.pop();
  while (vstack.length)
    vstack.pop();
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

////////////
// Advice //
////////////
global.ADVICE = {SANDBOX:global};

///////////////
// Producers //
///////////////
const fhandlers = {
  apply: (target, value, values) => {
    if (cstack.length)
      return Reflect.apply(target, value, values);
    try {
      return Reflect.apply(target, value, values);
    } catch (error) {
      cleanup();
      throw error;
    }
  },
  construct: (target, values) => {
    if (cstack.length)
      return Reflect.construct(target, values);
    try {
      return Reflect.construct(target, values);
    } catch (error) {
      cleanup();
      throw error;
    }
  }
};
ADVICE.arrival = (strict, scope, serial) => {
  cstack.push(scopes.get(scope.callee).concat([{
    type: "closure",
    binding: Object.create(null)
  }]));
  return {
    callee: produce("arrival-callee", [strict], scope.callee, serial),
    new: produce("arrival-new", [strict], scope.new, serial),
    this: produce("arrival-this", [strict], scope.this, serial),
    arguments: produce("arrival-arguments", [strict], scope.arguments, serial)
  };
};
ADVICE.begin = (strict, scope, value, serial) => {
  estack.push(null);
  if (scope) {
    cstack.push([{
      type: "block",
      binding: Object.create(null)
    }]);
    Object.keys(scope).sort().reverse().forEach((key) => {
      scope[key] = produce("begin-"+key, [strict], scope[key], serial);
    });
  } else {
    cstack[cstack.length-1].push({
      type: strict ? "closure" : "block",
      binding: Object.create(null)
    });
  }
  return scope;
};
ADVICE.primitive = (value, serial) =>
  produce("primitive", [], value, serial);
ADVICE.regexp = (value, serial) =>
  produce("regexp", [], value, serial);
ADVICE.load = (name, value, serial) => {
  vstack.push(saving[name]);
  return value;
}
ADVICE.discard = (identifier, value, serial) =>
  produce("discard", ["'"+identifier+"'"], value, serial);
ADVICE.closure = (value, serial) => {
  scopes.set(value, cstack[cstack.length-1].slice());
  return produce("closure", [], new Proxy(value, fhandlers), serial);
};
ADVICE.read = (identifier, value, serial) => {
  let call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bind(frame, identifier)) {
      if (frame.type === "with")
        return produce("with-read", ["'"+identifier+"'"], value, null);
      vstack.push(frame.binding[identifier]);
      return value;
    }
  };
  return produce("global-read", ["'"+identifier+"'"], value, null);
};
ADVICE.catch = (value, serial) => {
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
ADVICE.with = (value, serial) => {
  cstack[cstack.length-1].push({type:"with", binding:value});
  return consume("with", [], value, serial);
};
ADVICE.success = (scope, value, serial) => {
  vstack.push(estack.pop());
  return scope ? consume("success", [], value, serial) : value;
};
ADVICE.failure = (scope, error, serial) => {
  estack.pop();
  if (scope)
    cleanup();
  return error;
};
ADVICE.completion = (value, serial) => {
  estack[estack.length-1] = vstack.pop();
  return value;
};
ADVICE.save = (name, value, serial) => {
  saving[name] = vstack.pop();
  return value;
};
ADVICE.throw = (value, serial) =>
  consume("throw", [], value, serial);
ADVICE.test = (value, serial) =>
  consume("test", [], value, serial);
ADVICE.eval = (value, serial) =>
  instrument(consume("eval", [], value, serial), null);
ADVICE.return = (scope, value, serial) => {
  cstack.pop();
  return consume("return", [], value, serial);
};
ADVICE.write = (identifier, value, serial) => {
  const call = cstack[cstack.length-1];
  let index = call.length;
  while (index--) {
    const frame = call[index];
    if (bind(frame, identifier)) {
      if (frame.type === "with")
        return consume("with-write", ["'"+identifier+"'"], value, null);
      frame.binding[identifier] = vstack.pop();
      return value;
    }
  }
  return consume("global-write", ["'"+identifier+"'"], value, null);
};
ADVICE.declare = (kind, identifier, value, serial) => {
  const call = cstack[cstack.length-1];
  let frame = call[call.length-1];
  if (kind === "var") {
    let index = call.length-1;
    while (call[index].type !== "closure") {
      if (!index)
        return consume("global-declare", ["'var'", "'"+identifier+"'"], value, null);
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
ADVICE.copy = (position, serial) => {
  vstack.push(vstack[vstack.length-position]);
};
ADVICE.swap = (position1, position2, serial) => {
  const temporary = vstack[vstack.length-position1];
  vstack[vstack.length-position1] = vstack[vstack.length-position2];
  vstack[vstack.length-position2] = temporary;
};
ADVICE.drop = (serial) => {
  vstack.pop();
};
ADVICE.end = (scope, serial) => {};
ADVICE.leave = (type, serial) => cstack[cstack.length-1].pop();
ADVICE.block = (serial) => cstack[cstack.length-1].push({
  type: "block",
  binding: Object.create(null)
});
ADVICE.try = (serial) => cstack[cstack.length-1].push({
  type: "try",
  binding: Object.create(null),
  recovery: vstack.length
});
ADVICE.finally = (serial) => cstack[cstack.length-1].push({
  type: "finally",
  binding: Object.create(null)
});
ADVICE.label = (boolean, label, serial) => cstack[cstack.length-1].push({
  type: "label",
  binding: Object.create(null),
  label: (boolean ? "Break" : "Continue") + (label||"")
});
ADVICE.break = (boolean, label, serial) => {
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
ADVICE.apply = (value, values, serial) => combine(
  value(...values),
  "apply", [cut(values.length), vstack.pop()], serial);
ADVICE.invoke = (value1, value2, values, serial) => combine(
  Reflect.apply(value1[value2], value1, values),
  "invoke", [cut(values.length), vstack.pop(), vstack.pop()], serial);
ADVICE.construct = (value, values, serial) => combine(
  new value(...values),
  "construct", [cut(values.length), vstack.pop()], serial);
ADVICE.unary = (operator, value, serial) => combine(
  eval(operator+" value"),
  "unary", [vstack.pop(), "'"+operator+"'"], serial);
ADVICE.binary = (operator, value1, value2, serial) => combine(
  eval("value1 "+operator+" value2"),
  "binary", [vstack.pop(), vstack.pop(), "'"+operator+"'"], serial);
ADVICE.get = (value1, value2, serial) => combine(
  value1[value2],
  "get", [vstack.pop(), vstack.pop()], serial);
ADVICE.set = (value1, value2, value3, serial) => combine(
  value1[value2] = value3,
  "set", [vstack.pop(), vstack.pop(), vstack.pop()], serial);
ADVICE.delete = (value1, value2, serial) => combine(
  delete value1[value2],
  "delete", [vstack.pop(), vstack.pop()], serial);
ADVICE.array = (values, serial) => combine(
  values,
  "array", [cut(values.length)], serial);
ADVICE.object = (keys, object, serial) => {
  const strings = keys.reverse().map((key) => JSON.stringify(key)+":"+vstack.pop());
  return combine(object, "object", ["{"+strings.reverse().join(",")+"}"], serial);
};

///////////
// Setup //
///////////
// The sandbox must be activated to output the same result as shadow-value.
const aran = Aran({
  namespace:"ADVICE",
  sandbox: true,
  pointcut: true
});
global.eval(Astring.generate(aran.setup()));
const instrument = (script, scope) => Astring.generate(aran.weave(Acorn.parse(script), scope));
module.exports = instrument;