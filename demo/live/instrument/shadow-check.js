
const Acorn = require("acorn");
const Aran = require("aran.js");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabel = Symbol("label");
const SymbolSerial = Symbol("serial");
const SymbolStackLength = Symbol("stack-length");

///////////
// State //
///////////

let scope = null;
const scopeof = new WeakMap();
const callstack = [];
const stack = [];

/////////////
// Helpers //
/////////////

const cleanup = () => {
  while (stack.length)
    stack.pop();
  while (callstack.length)
    callstack.pop();
  scope = null;
  metaerror = null;
};

const print = (value) => {
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "function")
    return "[function]";
  if (Array.isArray(value))
    return "[array]";
  if (value && typeof value === "object")
    return "[object]";
  return String(value);
};

const location = (serial) => [
  aran.nodes[serial].loc.start.line,
  aran.nodes[serial].loc.start.column
].join(":");

const signal = (message) => {
  process.stderr.write((new Error(message)).stack+"\n");
  process.exit(1);
};

const check = (name, value1, value2, array, serial) => {
  if (value1 !== value2) {
    const loc = aran.nodes[serial].loc;
    signal([
      "Value mismatch ["+name+"]@"+loc.start.line+":"+loc.start.column,
      "=====================",
      "  Expected: "+print(value1),
      "  Got:      "+print(value2),
      "  Context:  ["+array.map(print).join(", ")+"]"
    ].join("\n"));
  }
};

const advice = {};

///////////////
// Producers //
///////////////

advice.primitive = function (value, serial) {
  stack.push(value);
  return value;
};

advice.builtin = function (value, name, serial) {
  stack.push(value);
  return value;
};

advice.read = (value, identifier, serial) => {
  check("read", scope[identifier], value, [identifier], serial);
  stack.push(value);
  return value;
};

///////////////
// Consumers //
///////////////

advice.drop = function (value, serial) {
  check("drop", stack.pop(), value, [], serial);
  return value;
};

advice.write = function (value, identifier, serial) {
  check("write", stack.pop(), value, [identifier], serial);
  let frame = scope;
  while (!Reflect.getOwnPropertyDescriptor(frame, identifier))
    frame = Reflect.getPrototypeOf(frame);
  frame[identifier] = value;
  return value;
};

advice.test = function (value, serial) {
  check("test", stack.pop(), value, [], serial);
  return value;
};

advice.throw = function (value, serial) {
  check("throw", stack.pop(), value, [], serial);
  return value;
};

///////////////
// Combiners //
///////////////

advice.construct = function (value1, values, serial) {
  [value1].concat(values).reverse().forEach((value, index, array) => {
    check("construct", stack.pop(), value, array, serial);
  });
  const value2 = Reflect.construct(value1, values);
  stack.push(value2);
  return value2;
};

advice.apply = (value1, value2, values, serial) => {
  [value1, value2].concat(values).reverse().forEach((value, index, array) => {
    check("apply", stack.pop(), value, array, serial);
  });
  const value3 = Reflect.apply(value1, value2, values);
  stack.push(value3)
  return value3;
};

/////////////
// Closure //
/////////////

advice.closure = (value1, serial) => {
  scopeof.set(value1, scope);
  const value2 = function () {
    "use strict";
    if (scope) {
      if (new.target)
        return Reflect.construct(value1, arguments);
      return Reflect.apply(value1, this, arguments);
    }
    try {
      if (new.target)
        return Reflect.construct(value1, arguments);
      return Reflect.apply(value1, this, arguments);
    } catch (error) {
      cleanup();
      throw error;
    }
  };
  stack.push(value2);
  return value2;
};

advice.arrival = (value1, value2, value3, value4, serial) => {
  callstack.push(scope);
  scope = scopeof.get(value1);
  stack.push(value4, value3, value2, value1);
  return [value1, value2, value3, value4];
};

advice.return = (value, serial) => {
  check("return", stack.pop(), value, [], []);
  scope = callstack.pop();
  return value;
};

///////////
// Block //
///////////

advice.enter = (tag, label, identifiers, serial) => {
  scope = Object.create(scope);
  for (let index=0; index<identifiers.length; index++)
    Reflect.defineProperty(scope, identifiers[index], {writable:true});
  Reflect.defineProperty(scope, SymbolTag, {value:tag});
  Reflect.defineProperty(scope, SymbolLabel, {value:label});
  Reflect.defineProperty(scope, SymbolSerial, {value:serial});
  if (tag === "try") {
    Reflect.defineProperty(scope, SymbolStackLength, {value:stack.length})
  }
};

advice.leave = (serial) => {
  if (scope[SymbolSerial] !== serial)
    signal("Serial mismatch: expected "+scope[SymbolSerial]+", got: "+serial);
  scope = Reflect.getPrototypeOf(scope);
};

advice.error = (value, serial) => {
  while (scope[SymbolTag] !== "try") {
    if (scope[SymbolTag] === "closure") {
      scope = callstack.pop();
    } else {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  while (stack.length > scope[SymbolStackLength]) {
    stack.pop();
  }
  scope = Reflect.getPrototypeOf(scope);
  stack.push(value);
  return value;
};

advice.continue = (label, serial) => {
  if (label) {
    while (scope[SymbolLabel] !== label) {
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
    while (scope[SymbolLabel] !== label) {
      scope = Reflect.getPrototypeOf(scope);
    }
  } else {
    while (scope[SymbolTag] !== "loop" && scope[SymbolTag] !== "switch") {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  scope = Reflect.getPrototypeOf(scope);
};

/////////////
// Program //
/////////////

advice.eval = function (value, serial) {
  check("eval", stack.pop(), value, [], serial);
  const pointcut = (name) => name !== "success" && name !== "failure" 
  return Astring.generate(aran.weave(Acorn.parse(value, {locations:true}), pointcut, serial));
};

advice.failure = (value, serial) => {
  cleanup();
  return value;
};

advice.success = (value, serial) => {
  check("success", stack.pop(), value, [], serial);
  if (scope !== null)
    signal("Non null scope");
  if (stack.length)
    signal("Non empty stack: ["+stack.map(print).join(", ")+"]");
  if (callstack.length)
    signal("Non empty callstack: ["+callstack.map(print).join(", ")+"]");
  return value;
};

////////////
// Return //
////////////

const aran = Aran();
global[aran.namespace] = advice;
global.eval(Astring.generate(aran.setup()));
module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, (name, node) => true, null);
  return Astring.generate(estree2);
};
