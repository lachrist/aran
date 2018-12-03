
const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabel = Symbol("label");
const SymbolStackLength = Symbol("stack-length");

///////////
// State //
///////////

let counter = 0;
let scope = [];
const callstack = [];
const stack = [];
const scopeof = new WeakMap();

/////////////
// Helpers //
/////////////

const produce = (origin, serial) => {
  console.log(">> #"+(++counter)+" "+origin+" @"+serial);
  stack.push("#"+counter);
};

const consume = (origin, serial) => {
  console.log("<< "+stack.pop()+" "+origin+" @"+serial);
};

///////////////
// Producers //
///////////////

exports.primitive = (value, serial) => {
  produce("primitive", serial);
  return value;
};

exports.builtin = (value, name, serial) => {
  produce("builtin("+name+")", serial);
  return value;
};

exports.read = (value, identifier) => {
  stack.push(scope[identifier]);
  return value;
};

///////////////
// Consumers //
///////////////

exports.drop = (value, serial) => {
  consume("drop", serial);
  return value;
};

exports.write = (value, identifier, serial) => {
  scope[identifier] = stack.pop();
  return value;
};

exports.test = (value, serial) => {
  consume("test", serial);
  return value;
};

exports.throw = (value, serial) => {
  consume("throw", serial);
  return value;
};

exports.eval = (value, serial) => {
  consume("eval", serial);
  return aran.weave(); // TODO
};

///////////////
// Combiners //
///////////////

exports.construct = (value, values, serial) => {
  const result = Reflect.construct(value, values);
  produce("construct("+vstack.splice(-values.length-1)+")", serial);
  return result;
};

exports.apply = (value1, value2, values, serial) => {
  const result = Reflect.apply(value1, value2, values);
  produce("apply("+vstack.splice(-values.length-2)+")", serial);
  return result;
};

/////////////
// Closure //
/////////////

exports.closure = (value, serial) => {
  produce("closure", serial);
  scopeof.set(value, scope);
  return value;
};

exports.arrival = (value1, value2, value3, value4, serial) => {
  callstack.push(scope);
  scope = scopeof(value1);
  produce("calllee", serial);
  produce("new.target", serial);
  produce("this", serial);
  produce("arguments", serial);
  return [value1, value2, value3, value4];
};

exports.return = (value, serial) => {
  consume("return", serial);
  scope = callstack.pop();
  return value;
};

///////////
// Block //
///////////

exports.enter = (tag, label, identifiers, serial) => {
  scope = Object.create(scope);
  for (let identifier of identifiers)
    Object.defineProperty(scope, identifier, {writable:true});
  Object.defineProperty(scope, SymbolTag, tag);
  Object.defineProperty(scope, SymbolLabel, label);
  if (tag === "try") {
    Object.defineProperty(scope, SymbolStackLength, stack.length)
  }
};

exports.leave = (serial) => {
  scope = Object.getPrototypeOf(scope);
};

exports.error = (value, serial) => {
  while (scope[SymbolTag] !== "try") {
    scope = Reflect.getPrototypeOf(scope);
    if (scope[SymbolTag] === "closure") {
      scope = callstack.pop();
    }
  }
  while (stack.length > scope[SymbolStackLength]) {
    stack.pop();
  }
  produce("error", serial);
  return value;
};

exports.continue = (label) => {
  if (label) {
    while (Object.getPrototypeOf(scope)[SymbolLabel] !== label) {
      scope = Object.getPrototypeOf(scope);
    }
  } else {
    while (Object.getPrototypeOf(scope)[SymbolTag] !== "loop") {
      scope = Object.getPrototypeOf(scope);
    }
  }
};

exports.break = (label) => {
  if (label) {
    while (scope[SymbolLabel] !== label) {
      scope = Object.getPrototypeOf(scope);
    }
  } else {
    while (scope[SymbolTag] !== "loop" || scope[SymbolTag] !== "switch") {
      scope = Object.getPrototypeOf(scope);
    }
  }
};

/////////////
// Program //
/////////////

exports.failure = (value, serial) => {
  return value;
};

exports.success = (value, serial) => {
  consume("success", serial);
  return value;
};























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


const produce = (name, arguments) => {
  console.log("#"+(++counter)+" = "+name+"("+Array.from(arguments).map(print).join(", ")+")");
  vstack.push("&"+counter);
};

const consume = (name, arguments) => {
  console.log()
};

////////////
// Advice //
////////////
global.ADVICE = {};

///////////////
// Producers //
///////////////

// ADVICE.primitive = (primitive) => produce()

// ADVICE.arrival = (strict, scope, arguments, serial) => {
//   cstack.push(scopes.get(scope.callee).concat([{
//     type: "closure",
//     binding: Object.create(null)
//   }]));
//   return {
//     callee: produce("arrival-callee", [strict], scope.callee, serial),
//     new: produce("arrival-new", [strict], scope.new, serial),
//     this: produce("arrival-this", [strict], scope.this, serial),
//     arguments: produce("arrival-arguments", [strict], scope.arguments, serial)
//   };
// };
// ADVICE.begin = (strict, scope, global, serial) => {
//   estack.push(null);
//   if (scope) {
//     cstack.push([{
//       type: "block",
//       binding: scope
//     }]);
//   } else {
//     cstack[cstack.length-1].push({
//       type: strict ? "closure" : "block",
//       binding: Object.create(null)
//     });
//   }
//   return global;
// };

const whandlers = {
  get: (target, key, receiver) => {
    const unscopables = target.binding[Symbol.unscopables];
    if (key in target.binding && unscopables && !unscopables[key])
      return produce("with-get", [key, null]);
    return Reflect.get(target.parent, key, receiver);
  },
  set: (target, key, value) => {
    const unscopables = target.binding[Symbol.unscopables];
    if (key in target.binding && unscopables && !unscopables[key])
      return true;
    return Reflect.set(target.parent, key, value, receiver);
  }
}

ADVICE.sandbox = (global, serial) => {};


ADVICE.with = (value, serial) => {
  cstack[cstack.length-1] = new Proxy({
    binding: value,
    parent: cstack[cstack.length-1]
  }, whandlers);
  return value;
};

ADVICE.arrival = (callee, serial) => {
  cstack.push(scopes.get(callee).concat());
};

ADVICE.primitive = function (value, serial) {
  produce("primitive", arguments);
  return value;
};

ADVICE.builtin = function (name, value, serial) {
  produce("builtin", arguments);
  return value;
};

ADVICE.discard = function (identifier, value, serial) {
  produce("discard", arguments);
  return value;
}

ADVICE.closure = (value, serial) => {
  produce("closure", arguments);
  scopes.set(value, cstack[cstack.length-1].slice());
  return function () {
    if (cstack.length)
      return new.target ?
        Reflect.construct(value, arguments) :
        Reflect.apply(value, this, arguments);
    try {
      return new.target ?
        Reflect.construct(value, arguments) :
        Reflect.apply(value, this, arguments);
    } catch (error) {
      cleanup();
      throw error;
    }
  };
};

ADVICE.read = (identifier, value, serial) => {
  const scope = cstack[cstack.length-1];
  while () {

  }

}
  vstack.push(cstack[cstack.length-1][identifier]),
  value);

ADVICE.write = (identifier, value, serial) => (
  (
    (identifier in cstack[cstack.length-1]) ?
    cstack[cstack.length-1][identifier] = vstack.pop() :
    vstack.pop()),
  value);

ADVICE.declare = (kind, identifier, value, serial) => {
  const scope = cstack[cstack.length-1];
  Object.defineProperty(
    

  if (kind === "var") {
    while (scope[type] !== "closure") {
      scope = Object.getPrototypeOf(scope);
    }
  }
  Object.defineProperty(scope, identifier, {
    writable: kind !== "const",
    value: vstack.pop()
  });
};

const whandlers = {
  getPrototypeOf (target, ) => 

};

ADVICE.with = (value, serial) => {
  cstack.last().push(new Proxy(value, {}));
};

ADVICE.enter = (name) => {
  cstack.last().push(Object.create(null));
  cstack.last().push()
  frame[SymbolType] = name;
  cstack[cstack.length-1] = frame;
};

ADVICE.leave = (name) => {
  cstack.last().pop();
  if (cstack.last().last()[SymbolType] === "with") {
    cstack.last().pop();
  }
};

// ADVICE.read = (identifier, value, serial) => {
//   let call = cstack[cstack.length-1];
//   let index = call.length;
//   while (index--) {
//     const frame = call[index];
//     if (bind(frame, identifier)) {
//       if (frame.type === "with")
//         return produce("with-read", ["'"+identifier+"'"], value, null);
//       vstack.push(frame.binding[identifier]);
//       return value;
//     }
//   };
//   return produce("global-read", ["'"+identifier+"'"], value, null);
// };
// ADVICE.catch = (value, serial) => {
//   while (cstack.length) {
//     let call = cstack[cstack.length-1];
//     let index = call.length;
//     while (index--) {
//       const frame = call[index];
//       if (frame.type === "try") {
//         call.push({type:"catch", binding:Object.create(null)});
//         while (vstack.length > frame.recovery)
//           vstack.pop();
//         return produce("catch", [], value, serial);
//       }
//     }
//     cstack.pop();
//   }
// };

///////////////
// Consumers //
///////////////

ADVICE.with = (value, serial) => {
  cstack[cstack.length-1].push({type:"with", binding:value});
  return consume("with", [], value, serial);
};

ADVICE.success = (value, serial) => {
  vstack.push(estack.pop());
  return scope ? consume("success", [], value, serial) : value;
};

ADVICE.failure = (error, serial) => {
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
  Astring.generate(aran.weave(acorn.parse(consume("eval", [], value, serial)), pointcut, null));

ADVICE.return = (value, serial) => {
  cstack.pop();
  consume("return", [], serial);
  return value;
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

ADVICE.drop = (serial) => {
  vstack.pop();
};

ADVICE.end = (serial) => {};

ADVICE.leave = (type, serial) => cstack[cstack.length-1].pop();

ADVICE.block = (serial) => {

  cstack[cstack.length-1].push({
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
const aran = Aran({namespace:"ADVICE"});
const pointcut = Object.keys(ADVICE);
global.eval(Astring.generate(aran.setup));
module.exports = (script) => Astring.generate(aran.weave(Acorn.parse(script), pointcut, ["this"]));