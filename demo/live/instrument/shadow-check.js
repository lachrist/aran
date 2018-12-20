
const Acorn = require("acorn");
const Aran = require("aran.js");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabel = Symbol("label");
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

const check = (name, args, value1, value2) => {
  if (!Object.is(value1, value2)) {
    console.log(value1);
    console.log(value2);
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
  const estree1 = Acorn.parse(value, {locations:true});
  const estree2 = aran.weave(estree1, pointcut, serial);
  return Astring.generate(estree2);
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
  while (scope[SymbolTag] !== "closure" && scope[SymbolTag] !== "program")
    scope = Reflect.getPrototypeOf(scope);
  while (stack.length >= scope[SymbolStackLength])
    stack.pop();
  scope = callstack.pop();
  if (scope !== undefined)
    stack.push(value);
  return value;
};

///////////////
// Informers //
///////////////

advice.debugger = function (serial) {};

advice.arrival = function (context, serial) {
  callstack.push(scope);
  if (context.callee) {
    if (scope !== undefined) {
      check("arrival-newtarget", arguments, context["new.target"], stack.pop());
      for (let index = values.length-1; index >= 0; index--)
        check("arrival-"+index, arguments, context.arguments[index], stack.pop());
      if (value2 !== undefined)
        check("arrival-this", arguments, context.this, stack.pop());
      check("arrival-callee", arguments, context.callee, stack.pop());
    }
    for (let index = context.arguments.length-1; index >= 0; index--)
      stack.push(context.arguments[index]);
    stack.push(context.arguments.length);
    stack.push(context.this);
    stack.push(context["new.target"]);
    scope = scopeof.get(value1);
  } else if (!aran.nodes[serial].AranParent) {
    scope = null;
  }
};

advice.program = (value, serial1, serial2) => {
  callstack.push(scope);
  if (serial1 === null)
    scope = null;
};

advice.enter = function (tag, label, identifiers, serial) {
  if (tag === "catch") {
    while (scope[SymbolTag] !== "try")
      scope = Reflect.getPrototypeOf(scope);
    const error = stack.pop();
    while (scope[SymbolStackLength] >= stack.length)
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
  Reflect.defineProperty(scope, SymbolLabel, {value:label});
  Reflect.defineProperty(scope, SymbolSerial, {value:serial});
};

advice.leave = function (serial) {
  check("leave", arguments, serial, scope[SymbolSerial]);
  scope = Reflect.getPrototypeOf(scope);
};

advice.continue = function (label, serial) {
  const predicate = label ?
    () => scope[SymbolLabel] !== label :
    () => scope[SymbolTag] !== "loop"
  while (predicate())
    scope = Reflect.getPrototypeOf(scope);
  scope = Reflect.getPrototypeOf(scope);
};

advice.break = function (label, serial) {
  const predicate = label ?
    () => scope[SymbolLabel] !== label :
    () => scope[SymbolTag] !== "loop" && scope[SymbolTag] !== "switch";
  while (predicate())
    scope = Reflect.getPrototypeOf(scope);
  scope = Reflect.getPrototypeOf(scope);
};

///////////////
// Combiners //
///////////////

advice.apply = function (value1, value2, values, serial) {
  for (let index = values.length-1; index >= 0; index--)
    check("apply-"+index, arguments, values[index], stack.pop());
  check("apply-this", arguments, value2, stack.pop());
  check("apply-callee", arguments, value1, stack.pop());
  if (scopeof.has(value1)) {
    stack.push(value1);
    stack.push(value2);
    for (let index = 0; index < values.length; index++)
      stack.push(values[index]);
    stack.push(undefined);
    const value3 = Reflect.apply(value1, value2, values);
    check("apply-result", arguments, value3, stack.pop());
    stack.push(value3);
    return value3;
  }
  try {
    callstack.push(scope);
    scope = undefined;
    if (value1 === eval) {
      const estree1 = Acorn.parse(values[0], {locations:true});
      const estree2 = aran.weave(estree1, () => true, null);
      values[0] = Astring.generate(estree2);
    }
    const value3 = Reflect.apply(value1, value2, values);
    scope = callstack.pop();
    stack.push(value3);
    return value3;
  } catch (value3) {
    scope = callstack.pop();
    stack.push(value3);
    throw value3;
  }
};

advice.construct = function (value1, values, serial) {
  for (let index = values.length-1; index >= 0; index--)
    check("construct-"+index, arguments, values[index], stack.pop());
  check("construct-callee", arguments, value1, stack.pop());
  if (scopeof.has(value1)) {
    stack.push(value1);
    for (let index = 0; index < values.length; index++)
      stack.push(values[index]);
    const value2 = Reflect.construct(value1, values, value1);
    check("construct-result", arguments, value2, stack.pop());
    stack.push(value2);
    return value;
  }
  try {
    const value2 = Reflect.construct(value1, values, value1);
    stack.push(value2);
    return value2;
  } catch (value2) {
    stack.push(value2);
    throw value2;
  }
};

///////////
// Setup //
///////////

const aran = Aran();
global[aran.namespace] = advice;
console.log(Astring.generate(aran.setup()));
global.eval(Astring.generate(aran.setup()));
const pointcut = (name, node) => true;
module.exports = (script) => {
  const estree1 = Acorn.parse(script, {locations:true});
  const estree2 = aran.weave(estree1, pointcut, null);
  return Astring.generate(estree2);
};
