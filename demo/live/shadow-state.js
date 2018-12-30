
const Acorn = require("acorn");
const Aran = require("aran.js");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabels = Symbol("labels");
const SymbolSerial = Symbol("serial");
const SymbolStackLength = Symbol("stack-length");

let counter = 0;
let scope = undefined;
const scopeof = new WeakMap();
const callstack = [];
const stack = [];
const advice = {};
const aran = Aran({format:"script"});
const pointcut = (name, node) => true;

global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script) => aran.weave(Acorn.parse(script), pointcut, null);

///////////////
// Producers //
///////////////

advice.primitive = (value, serial) => {
  stack.push(++counter);
  return value;
};

advice.builtin = (value, name, serial) => {
  stack.push(++counter);
  return value;
};

advice.closure = (value, serial) => {
  scopeof.set(value, scope);
  stack.push(++counter);
  return value;
};

advice.read = (value, identifier, serial) => {
  stack.push(scope[identifier]);
  return value;
};

advice.error = (value, serial) => {
  return value;
};

advice.argument = function (value, name, serial) {
  if (name === "length" || name === "new.target")
    stack.push(++counter)
  return value;
};

///////////////
// Consumers //
///////////////

advice.drop = (value, serial) => {
  stack.pop();
  return value;
};

advice.write = (value, identifier, serial) => {
  let frame = scope;
  while (!Reflect.getOwnPropertyDescriptor(frame, identifier))
    frame = Reflect.getPrototypeOf(frame);
  frame[identifier] = ++counter;
  return value;
};

advice.test = (value, serial) => {
  stack.pop();
  return value;
};

advice.throw = (value, serial) => {
  return value;
};

advice.eval = (value, serial) => {
  stack.pop();
  return aran.weave(Acorn.parse(value), pointcut, serial);
};

advice.return = (value, serial) => {
  scope = callstack.pop();
  if (scope === undefined)
    stack.pop();
  return value;
};

advice.abrupt = (value, serial) => {
  const meta = stack.pop();
  while (scope[SymbolTag] !== "closure")
    scope = Reflect.getPrototypeOf(scope);
  while (stack.length > scope[SymbolStackLength])
    stack.pop();
  scope = callstack.pop();
  if (scope !== undefined)
    stack.push(meta);
  return value;
};

advice.success = (value, serial) => {
  stack.pop();
  scope = callstack.pop();
  return value;
};

advice.failure = (value, serial) => {
  while (scope[SymbolTag] !== "program")
    scope = Reflect.getPrototypeOf(scope);
  while (stack.length > scope[SymbolStackLength])
    stack.pop();
  scope = callstack.pop();
  return value;
};

///////////////
// Informers //
///////////////

advice.debugger = (serial) => {};

advice.program = (value, serial) => {
  callstack.push(scope);
  scope = null;
};

advice.arrival = (value1, value2, value3, value4, serial) => {
  if (scope === undefined) {
    for (let index = 0; index < value4.length; index++)
      stack.push(++counter);
    if (value2 === undefined)
      stack.push(++counter);
    stack.push(++counter);
  }
  callstack.push(scope);
  scope = scopeof.get(value1);
};

advice.enter = (tag, labels, identifiers, serial) => {
  if (tag === "catch") {
    const meta = stack.pop();
    while (scope[SymbolTag] !== "try")
      scope = Reflect.getPrototypeOf(scope);
    const error = stack.pop();
    while (stack.length > scope[SymbolStackLength])
      stack.pop();
    stack.push(meta);
    scope = Reflect.getPrototypeOf(scope);
  }
  scope = Object.create(scope);
  for (let index = 0; index < identifiers.length; index++)
    Reflect.defineProperty(scope, identifiers[index], {writable:true});
  if (tag === "program" || tag === "closure" || tag === "try")
    Reflect.defineProperty(scope, SymbolStackLength, {value:stack.length});
  Reflect.defineProperty(scope, SymbolTag, {value:tag});
  Reflect.defineProperty(scope, SymbolLabels, {value:labels});
  Reflect.defineProperty(scope, SymbolSerial, {value:serial});
};

advice.leave = (serial) => {
  scope = Reflect.getPrototypeOf(scope);
};

advice.continue = (label, serial) => {
  if (label) {
    while (!scope[SymbolLabels].includes(label)) {
      scope = Reflect.getPrototypeOf(scope);
    }
  } else {
    while (scope[SymbolTag] !== "loop") {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  scope = Reflect.getPrototypeOf(scope);
};

advice.break = (label, serial) => {
  if (label) {
    while (!scope[SymbolLabels].includes(label)) {
      scope = Reflect.getPrototypeOf(scope);
    }
  } else {
    while (scope[SymbolTag] !== "loop" && scope[SymbolTag] !== "switch") {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  scope = Reflect.getPrototypeOf(scope);
};

///////////////
// Combiners //
///////////////

advice.unary = function (operator, value, serial) {
  stack.pop();
  try {
    return aran.unary(operator, value);
  } finally {
    stack.push(++counter);
  }
};

advice.binary = function (operator, value1, value2, serial) {
  stack.pop();
  stack.pop();
  try {
    return aran.binary(operator, value1, value2);
  } finally {
    stack.push(++counter);
  }
};

advice.apply = (value1, value2, values, serial) => {
  const metas = stack.splice(-values.length);
  const meta = stack.pop();
  stack.pop();
  if (scopeof.has(value1)) {
    stack.push(...metas);
    stack.push(meta);
    return Reflect.apply(value1, value2, values);
  }
  try {
    return Reflect.apply(value1, value2, values);
  } finally {
    stack.push(++counter);
  }
};

advice.construct = (value, values, serial) => {
  const metas = stack.splice(-values.length);
  stack.pop();
  if (scopeof.has(value)) {
    stack.push(...metas);
    return Reflect.construct(value, values);
  }
  try {
    return Reflect.construct(value, values);
  } finally {
    stack.push(++counter);
  }
}; 
