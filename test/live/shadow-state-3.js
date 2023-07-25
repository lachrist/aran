
const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");

const SymbolTag = Symbol("tag");
const SymbolLabels = Symbol("labels");
const SymbolStackLength = Symbol("stack-length");

let counter = 0;
let scope = {
  __proto__: null,
  [SymbolTag]: "external",
  [SymbolStackLength]: 0
};
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
    return "[function]";
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

advice.intrinsic = (value, name, serial) => {
  input("intrinsic-("+name+")", value, serial);
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

advice.this = (value, serial) => {
  stack.push(scope[symbols["this"]]);
  return value; 
};

advice.newtarget = (value, )

advice.argument = (value, property, serial) => {
  stack.push(scope[symbols["arguments"]][property]);
  return value;
};

// error | this | new.target | length | <number>
advice.argument = (value, name, serial) => {
  if (name === "length") {
    stack.push(scope[symbols.arguments].length);
  } else if (typeof name === "number") {
    stack.push(scope[symbols.arguments][name]);
  } else {
    stack.push(scope[symbols[name]]);
  }
};

// number identifier @error @callee @this @new.target @arguments.length @arguments[0]
advice.read = (value, name, serial) => {
  stack.push(scope[name]);
  return value;
};

advice.special = (value, name) => {
  stack.push(scope["@" + name]);
  return value;
};

advice.write = (value, name, serial) => {
  scope[name] = stack.pop();
  return value;
};

//////////////
// System 0 //
//////////////

advice.arrival = (context, serial) => {
  if (scope[SymbolTag] === "external") {
    vstack.push(shadow("arrival-callee", context.callee, serial));
    if (context.new)
    for (let index = 0; index < context.length; index++) {
      
    }
  }
  callstack.push(scope);
  scope = calle ? scopes.get(callee) : null;
};

advice.enter = (tag, context, labels, identifiers, serial) => {
  
};

advice.return = (value, serial) => {
  scope = callstack.pop();
  if (scope[SymbolTag] === "external") {
    vstack.pop();
  }
  return value;
};

const exception = (shadow) => {
  while (scope[SymbolTag] !== "try" && scope[SymbolTag] !== "external") {
    if (scope[SymbolTag] === "closure" || scope[SymbolTag] === "program") {
      scope = callstack.pop();
    } else {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  while (stack.length > scope[SymbolStackLength]) {
    vstack.pop();
  }
  if (scope[SymbolTag] === "try") {
    vstack.push(shadow);
    scope = Reflect.getPrototypeOf(scope);
  }
}

advice.throw = (value, serial) => {
  exception(vstack.pop());
  return value;
};

//////////////
// System 1 //
//////////////

// throw, break, continue, return are computed directly

advice.enter = (tag, context, labels, identifiers, serial) => {  
  if (tag === "closure" || tag === "program") {
    callstack.push(scope);
    if (tag === "closure") {
      scope = scopes.get(context.callee);
    } else {
      scope = null;
    }
  }
  scope = Object.create(scope);
  scope[SymbolTag] = tag;
  scope[SymbolLabels] = labels;
  if (tag === "try") {
    scope[SymbolStackLength] = stack.length;
  }
  if (tag === "closure") {
    if (callstack[callstack.length-1][SymbolTag] === "external") {
      scope["@new.target"] = shadow("arrival-closure-new.target", context["new.target"], serial);
      scope["@this"] = shadow("arrival-closure-this", context.this, serial);
      for (let index = 0; index < context.length; index++) {
        scope["@"+index] = shadow("arrival-closure-"+index, context[index], serial);
      }
    } else {
      for (let index = context.length-1; index >= 0; index--) {
        scope["@"+index] = vstack.pop();
      }
      if (context["new.target"]) {
        scope["@this"] = shadow("arrival-closure-this", context.this, serial);
        scope["@new.target"] = vstack.pop();
      } else {
        scope["@this"] = vstack.pop();
        scope["@new.target"] = shadow("arrival-closure-new.target", undefined, serial);
        vstack.pop();
      }
    }
  } else if (tag === "program") {
    if (callstack[callstack.length-1][SymbolTag] === "external") {
      scope["@this"] = shadow("arrival-program-this", context.this, serial);
    }
  } else if (tag === "catch") {
    scope["@error"] = context.error;
  }
};

advice.complete = () => {
  if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure") {
    throw new Error("This should never happen");
  }
  scope = Reflect.getPrototypeOf(scope);
};

advice.return = (value, serial) => {
  scope = callstack.pop();
  if (scope === undefined) {
    vstack.pop();
  }
  return value;
};

const goto = (label) => {
  while (!scope[SymbolLabels].includes(label)) {
    scope = Reflect.getPrototypeOf(scope);
    if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure") {
      throw new Error("This should never happen");
    }
  }
};

advice.break = goto;

advice.continue = goto;

const exception = (shadow) => {
  while (scope[SymbolTag] !== "try" && scope[SymbolTag] !== "external") {
    if (scope[SymbolTag] === "closure" || scope[SymbolTag] === "program") {
      scope = callstack.pop();
    } else {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  while (stack.length > scope[SymbolStackLength]) {
    stack.pop();
  }
  if (scope[SymbolTag] === "try") {
    scope = Reflect.getPrototypeOf(scope);
    vstack.push(shadow);
  }
};

advice.throw = (value, serial) => {
  exception(vstack.pop());
  return value;
}

advice.apply (value1, value2, values, serial) => {
  if (scopes.has(value1))
    return Reflect.apply(value1, value2, values);
  for (let index = values.length - 1; index >= 0; index--)
    output("apply-"+index, stack.pop(), serial);
  output("apply-this", stack.pop(), serial);
  output("apply-callee", stack.pop(), serial);
  callstack.push(scope);
  scope = {
    __proto__: null,
    [SymbolTag]: "external",
    [SymbolStackLength]: stack.length
  };
  try {
    const result = Reflect.apply(value1, value2, values);
    scope = callstack.pop();
    output("apply-result", result, serial);
    return result;
  } catch (error) {
    scope = callstack.pop();
    exception(shadow("apply-error", error, serial));
    throw error;
  }
};

//////////////
// System 2 //
//////////////

advice.enter = (tag, context, labels, identifiers, serial) => {
  const external = scope[SymbolTag] === "external";
  if (tag === "closure" || tag === "closure") {
    callstack.push(scope);
    scope = tag === "closure" ? scopes.get(context.callee) : null;
  }
  scope[SymbolTag] = tag;
  scope[SymbolStackLength] = stack.length;
  if (external) {
    for (let key of Reflect.ownKeys(context)) {
      scope["@" + key] = shadow("arrival-"+tag+"-"+key, context[key], serial);
    }
  } else {
    for (let key)
  }
  for (let key of Reflect.ownKeys(context)) {
    scope["@" + key] = shadow("arrival-"+tag+"-"+key, context[key], serial);
  }
  for (let identifier of identifiers) {
    scope[identifier] = SymbolUninitialised;
  }
};

advice.failure = (value, serial) => {
  while (stack.length > scope[SymbolStackLength]) {
    stack.pop();
  }
};

advice.leave = (serial) => {
  if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure") {
    scope = callstack.pop();
    if (scope[SymbolTag] === "external") {
      vstack.pop();
    }
  } else {
    scope = Reflect.getPrototypeOf(scope);
  }
};


advice.leave = (serial) => {
  let stacklength;
  if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure") {
    scope = callstack.pop();
    stacklength = scope[SymbolStackLength];
    if (scope[SymbolTag] !== "external") {
      stacklength++;
    }
  } else {
    scope = Reflect.getPrototypeOf(scope);
    stacklength = scope[SymbolStackLength];
  }
  while (stack.length > stacklength) {
    stack.pop();
  }
};

advice.failure = (value, serial) => {
  vstack.push(value)
};

//////////
// DONE //
//////////


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

const goto = (label, serial) => {
  
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

const internal = (closure) => {};

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
