
const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabels = Symbol("labels");
const SymbolSerial = Symbol("serial");
const SymbolStackLength = Symbol("stack-length");

const advice = {};

///////////
// State //
///////////

let scope = undefined;
const scopeof = new WeakMap();
const callstack = [];
const stack = [];

///////////
// Check //
///////////

const print = (value) => {
  if (value === global)
    return "(global)";
  if (value instanceof Error)
    return "(error " + value.message + ")";
  if (typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "function")
    return "(function "+value.name+")";
  if (Array.isArray(value))
    return "[" + value.map(print).join(", ") + "]";
  if (value && typeof value === "object")
    return "(object)";
  return String(value);
};

const check = (name, args, value1, value2) => {
  if (!Object.is(value1, value2)) {
    const loc = aran.nodes[args[args.length-1]].loc;
    process.stderr.write((new Error([
      "Mismatch at "+name,
      "Location: "+loc.start.line+":"+loc.start.column,
      "Got:      "+print(value1),
      "Expected: "+print(value2),
      "Arguments:  ["+Array.from(args).map(print).join(", ")+"]"
    ].join("\n"))).stack+"\n");
    process.exit(1);
  }
};

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

advice.closure = function (value, serial) {
  scopeof.set(value, scope);
  stack.push(value);
  return value;
};

advice.read = function (value, identifier, serial) {
  check("read", arguments, value, scope[identifier]);
  stack.push(value);
  return value;
};

advice.error = function (value, serial) {
  check("error", arguments, value, stack.pop());
  stack.push(value);
  return value;
};

advice.argument = function (value, name, serial) {
  check("argument", arguments, value, stack.pop());
  stack.push(value);
  return value;
};

///////////////
// Consumers //
///////////////

advice.drop = function (value, serial) {
  check("drop", arguments, value, stack.pop());
  return value;
};

advice.write = function (value, identifier, serial) {
  check("write", arguments, value, stack.pop());
  let frame = scope;
  while (!Reflect.getOwnPropertyDescriptor(frame, identifier))
    frame = Reflect.getPrototypeOf(frame);
  frame[identifier] = value;
  return value;
};

advice.test = function (value, serial) {
  check("test", arguments, value, stack.pop());
  return value;
};

advice.throw = function (value, serial) {
  check("throw", arguments, value, stack.pop());
  stack.push(value);
  return value;
};

advice.eval = function (value, serial) {
  check("eval", arguments, value, stack.pop());
  const estree = Acorn.parse(value, {locations:true});
  return aran.weave(estree, pointcut, serial);
};

advice.return = function (value, serial) {
  check("return", arguments, value, stack.pop());
  scope = callstack.pop();
  if (scope !== undefined)
    stack.push(value);
  return value;
};

advice.abrupt = function (value, serial) {
  check("abrupt", arguments, value, stack.pop());
  while (scope[SymbolTag] !== "closure")
    scope = Reflect.getPrototypeOf(scope);
  while (stack.length > scope[SymbolStackLength])
    stack.pop();
  scope = callstack.pop();
  if (scope !== undefined)
    stack.push(value);
  return value;
};

advice.success = function (value, serial) {
  check("success", arguments, value, stack.pop());
  scope = callstack.pop();
  return value;
};

advice.failure = function (value, serial) {
  check("failure", arguments, value, stack.pop());
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

advice.debugger = function (serial) {};

advice.program = function (value, serial) {
  callstack.push(scope);
  scope = null;
};

// callee, new.target, this, arguments
advice.arrival = function (value1, value2, value3, value4, serial) {
  if (scope !== undefined) {
    check("arrival-newtarget", arguments, value2, stack.pop());
    for (let index = value4.length-1; index >= 0; index--)
      check("arrival-"+index, arguments, value4[index], stack.pop());
    if (value2 === undefined)
      check("arrival-this", arguments, value3, stack.pop());
    check("arrival-callee", arguments, value1, stack.pop());
  }
  for (let index = value4.length-1; index >= 0; index--)
    stack.push(value4[index]);
  stack.push(value4.length);
  stack.push(value3);
  stack.push(value2);
  callstack.push(scope);
  scope = scopeof.get(value1);
};

advice.enter = function (tag, labels, identifiers, serial) {
  if (tag === "catch") {
    while (scope[SymbolTag] !== "try")
      scope = Reflect.getPrototypeOf(scope);
    const error = stack.pop();
    while (stack.length > scope[SymbolStackLength])
      stack.pop();
    stack.push(error);
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

advice.leave = function (serial) {
  check("leave", arguments, serial, scope[SymbolSerial]);
  scope = Reflect.getPrototypeOf(scope);
};

advice.continue = function (label, serial) {
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

advice.break = function (label, serial) {
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

const external = function (closure, argument0, argument1, argument2) {
  callstack.push(scope);
  scope = undefined;
  try {
    const value = closure(argument0, argument1, argument2);
    stack.push(value);
    return value;
  } catch (value) {
    stack.push(value);
    throw value;
  } finally {
    scope = callstack.pop();
  }
};

advice.unary = function (operator, value1, serial) {
  check("unary-argument", arguments, value1, stack.pop());
  return external(aran.unary, operator, value1, undefined);
};

advice.binary = function (operator, value1, value2, serial) {
  check("binary-right", arguments, value2, stack.pop());
  check("binary-left", arguments, value1, stack.pop());
  return external(aran.binary, operator, value1, value2);
};

advice.apply = function (value1, value2, values, serial) {
  for (let index = values.length-1; index >= 0; index--)
    check("apply-"+index, arguments, values[index], stack.pop());
  check("apply-this", arguments, value2, stack.pop());
  check("apply-callee", arguments, value1, stack.pop());
  if (!scopeof.has(value1))
    return external(Reflect.apply, value1, value2, values);
  stack.push(value1);
  stack.push(value2);
  for (let index = 0; index < values.length; index++)
    stack.push(values[index]);
  stack.push(undefined);
  const value3 = Reflect.apply(value1, value2, values);
  check("apply-result", arguments, value3, stack.pop());
  stack.push(value3);
  return value3;
};

advice.construct = function (value1, values, serial) {
  for (let index = values.length-1; index >= 0; index--)
    check("construct-"+index, arguments, values[index], stack.pop());
  check("construct-callee", arguments, value1, stack.pop());
  if (!scopeof.has(value1))
    return external(Reflect.construct, value1, values, value1);
  stack.push(value1);
  for (let index = 0; index < values.length; index++)
    stack.push(values[index]);
  stack.push(value1);
  const value2 = Reflect.construct(value1, values, value1);
  check("construct-result", arguments, value2, stack.pop());
  stack.push(value2);
  return value2;
};

///////////
// Setup //
///////////

// Object.keys(advice).forEach((name) => {
//   const trap = advice[name];
//   advice[name] = function () {
//     console.log(name+" "+Array.from(arguments).map(print).join(" "));
//     return Reflect.apply(trap, this, arguments);
//   };
// });

const aran = Aran({format:"script"});
global[aran.namespace] = advice;
global.eval(aran.setup());
const pointcut = (name, node) => true;
module.exports = (script1) => {
  const estree = Acorn.parse(script1, {locations:true});
  const block1 = aran.normalise(estree, null);
  const block2 = aran.ambush(block1, pointcut);
  // console.log(require("util").inspect(block2, {depth:null, colors:true}));
  const script2 = aran.generate(block2);
  return script2;
};
