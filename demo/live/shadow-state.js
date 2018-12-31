
const Acorn = require("acorn");
const Aran = require("aran.js");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabels = Symbol("labels");
const SymbolStackLength = Symbol("stack-length");

let counter = 0;
let scope = undefined;
const scopeof = new WeakMap();
const callstack = [];
const stack = [];
const advice = {};
const aran = Aran({format:"script"});
const pointcut = (name, node) => true;
const print = (value) => {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "function")
    return "[Function]"
  if (typeof value === "object" && value !== null)
    return Object.prototype.toString.call(value);
  return String(value);
};
const input = (name, value, serial) => {
  const shadow = ++counter;
  stack.push(shadow);
  console.log(shadow+" <= "+print(value)+" // "+name+"@"+serial);
};
const output = (name, value, serial) => {
  const shadow = stack.pop();
  console.log(shadow+" => "+print(value)+" // "+name+"@"+serial);
};

global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script) => aran.weave(Acorn.parse(script), pointcut, null);

///////////////
// Producers //
///////////////

advice.primitive = (value, serial) => {
  input("primitive", value, serial);
  return value;
};

advice.builtin = (value, name, serial) => {
  input("builtin-("+name+")", value, serial);
  return value;
};

advice.closure = (value, serial) => {
  scopeof.set(value, scope);
  input("closure", value, serial);
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
    input("argument-"+name, value, serial);
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
  frame[identifier] = stack.pop();
  return value;
};

advice.test = (value, serial) => {
  output("test", value, serial);
  return value;
};

advice.throw = (value, serial) => {
  return value;
};

advice.eval = (value, serial) => {
  output("eval", value, serial);
  return aran.weave(Acorn.parse(value), pointcut, serial);
};

advice.return = (value, serial) => {
  scope = callstack.pop();
  if (scope === undefined)
    output("return", value, null);
  return value;
};

advice.abrupt = (value, serial) => {
  const shadow = stack.pop();
  while (scope[SymbolTag] !== "closure")
    scope = Reflect.getPrototypeOf(scope);
  while (stack.length > scope[SymbolStackLength])
    stack.pop();
  scope = callstack.pop();
  if (scope !== undefined)
    stack.push(shadow);
  return value;
};

advice.success = (value, serial) => {
  scope = callstack.pop();
  output("success", value, serial);
  return value;
};

advice.failure = (value, serial) => {
  const shadow = stack.pop();
  while (scope[SymbolTag] !== "program")
    scope = Reflect.getPrototypeOf(scope);
  while (stack.length > scope[SymbolStackLength])
    stack.pop();
  scope = callstack.pop();
  return output("failure", value, serial);
};

///////////////
// Informers //
///////////////

advice.debugger = (serial) => {};

advice.program = (value, serial) => {
  callstack.push(scope);
  scope = null;
};

advice.arrival = (callee, newtarget, self, arguments, serial) => {
  if (scope === undefined) {
    for (let index = arguments.length - 1; index >= 0; index--) {
      input("arrival-argument-"+index, arguments[index], null);
    }
    if (newtarget === undefined) {
      input("arrival-this", self, null);
    }
  }
  callstack.push(scope);
  scope = scopeof.get(callee);
};

advice.enter = (tag, labels, identifiers, serial) => {
  if (tag === "catch") {
    const shadow = stack.pop();
    while (scope[SymbolTag] !== "try")
      scope = Reflect.getPrototypeOf(scope);
    while (stack.length > scope[SymbolStackLength])
      stack.pop();
    stack.push(shadow);
    scope = Reflect.getPrototypeOf(scope);
  }
  scope = Object.create(scope);
  for (let index = 0; index < identifiers.length; index++)
    Reflect.defineProperty(scope, identifiers[index], {writable:true});
  if (tag === "program" || tag === "closure" || tag === "try")
    Reflect.defineProperty(scope, SymbolStackLength, {value:stack.length});
  Reflect.defineProperty(scope, SymbolTag, {value:tag});
  Reflect.defineProperty(scope, SymbolLabels, {value:labels});
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
  output("unary-argument-("+operator+")", value, serial);
  callstack.push(scope);
  scope = undefined;
  try {
    const result = aran.unary(operator, value, serial);
    input("unary-result-("+operator+")", result, serial);
    return result;
  } catch (error) {
    input("unary-error-("+operator+")", error, serial);
    throw error;
  } finally {
    scope = callstack.pop();
  }
};

advice.binary = function (operator, value1, value2, serial) {
  output("binary-right-("+operator+")", value2, serial);
  output("binary-left-("+operator+")", value1, serial);
  callstack.push(scope);
  scope = undefined;
  try {
    const result = aran.binary(operator, value1, value2);
    input("binary-result-("+operator+")", result, serial);
    return result;
  } catch (error) {
    input("binary-error-("+operator+")", error, stack);
    throw error;
  } finally {
    scope = callstack.pop();
  }
};

advice.apply = (value1, value2, values, serial) => {
  if (scopeof.has(value1)) {
    const shadows = values.length ? stack.splice(-values.length) : [];
    const shadow = stack.pop();
    output("apply-callee", value1, serial);
    stack.push(...shadows.reverse());
    stack.push(shadow);
    return Reflect.apply(value1, value2, values);
  }
  callstack.push(scope);
  scope = undefined;
  try {
    for (let index = values.length - 1; index >= 0; index--)
      output("apply-argument-"+index, values[index], serial);
    output("apply-this", value2, serial);
    output("apply-callee", value1, serial);
    const result = Reflect.apply(value1, value2, values);
    input("apply-result", result, serial);
    return result;
  } catch (error) {
    input("apply-error", error, serial);
    throw error;
  } finally {
    scope = callstack.pop();
  }
};

advice.construct = (value, values, serial) => {
  if (scopeof.has(value)) {
    const shadows = values.length ? stack.splice(-values.length) : [];
    output("construct-callee", value, serial);
    stack.push(...shadows.reverse());
    return Reflect.construct(value, values);
  }
  callstack.push(scope);
  scope = undefined;
  try {
    for (let index = values.length - 1; index >= 0; index--)
      output("construct-argument-"+index, values[index], serial);
    output("construct-callee", value, serial);
    const result = Reflect.construct(value, values);
    input("construct-result", result, serial);
    return result;
  } catch (error) {
    input("construct-error", error, serial);
    throw error;
  } finally {
    scope = callstack.pop();
  }
}; 
