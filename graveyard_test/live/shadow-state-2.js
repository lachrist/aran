
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
const scopes = new WeakMap();
const callstack = [];
const stack = [];
const advice = {};
const aran = Aran({format:"script"});
const pointcut = (name, node) => true;
global[aran.namespace] = advice;
global.eval(aran.setup());
module.exports = (script) => aran.weave(Acorn.parse(script), pointcut, null);

/////////////
// Helpers //
/////////////

const print = (base) => {
  if (typeof base === "object" || typeof base === "function")
    return base ? Object.prototype.toString.call(base) : null;
  if (typeof base === "string")
    return JSON.stringify(base);
  return String(base);
};

const mirror = (base, info, serial) => {
  const meta = ++counter;
  console.log("#"+meta+" := "+print(base)+" // "+info+"@"+serial);
  return meta;
};

const use = (meta, info, serial) => {
  console.log("#"+meta+" // "+info+"@"+serial);
};

const exception = (meta) => {
  while (scope[SymbolTag] !== "try" && scope[SymbolTag] !== "external") {
    if (scope[SymbolTag] === "closure" || scope[SymbolTag] === "program") {
      scope = callstack.pop();
    } else {
      scope = Reflect.getPrototypeOf(scope);
    }
  }
  while (stack.length > scope[SymbolStackLength])
    stack.pop();
  if (scope[SymbolTag] === "try") {
    stack.push(meta);
    scope = Reflect.getPrototypeOf(scope);
  }
};

const goto = (label) => {
  while (!scope[SymbolLabels].includes(label)) {
    if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure" || scope[SymbolTag] === "eval")
      throw new Error("This should never happen: unmatched label");
    scope = Reflect.getPrototypeOf(scope);
  }
};

const apply = (name, closure, bases) => {
  callstack.push(scope);
  scope = {
    __proto__: null,
    [SymbolTag]: "external",
    [SymbolStackLength]: stack.length
  };
  try {
    const base = closure(...bases);
    stack.push(mirror(base, name+"-result", serial));
    scope = callstack.pop();
    return base;
  } catch (base) {
    exception(mirror(base, name+"-error", serial));
    throw base;
  }
};

///////////////
// Producers //
///////////////

advice.primitive = (base, serial) => {
  stack.push(mirror(base, "primitive", serial));
  return base;
};

advice.intrinsic = (base, name, serial) => {
  stack.push(mirror(base, "intrinsic-("+name+")", serial));
  return base;
};

advice.closure = (base, serial) => {
  scopes.set(base, scope);
  stack.push(mirror(base, "closure", value, serial));
  return base;
};

advice.read = (base, name, serial) => {
  stack.push(scope[name]);
  return base;
};

advice.context = (base, name, serial) => {
  stack.push(scope["@"+name]);
  return base;
};

///////////////
// Consumers //
///////////////

advice.drop = (base, serial) => {
  stack.pop();
  return base;
};

advice.write = (base, identifier, serial) => {
  let frame = scope;
  while (!Reflect.getOwnPropertyDescriptor(frame, identifier))
    frame = Reflect.getPrototypeOf(frame);
  frame[identifier] = stack.pop();
  return base;
};

advice.test = (base, serial) => {
  use(stack.pop(), "test", serial);
  return base;
};

advice.throw = (base, serial) => {
  exception(stack.pop());
  return base;
};

advice.eval = (base, serial) => {
  use(stack.pop(), "eval", serial);
  return aran.weave(Acorn.parse(base), pointcut, serial);
};

advice.return = (base, serial) => {
  scope = callstack.pop();
  if (scope[SymbolTag] === "external")
    use(stack.pop(), "return", serial);
  return base;
};

///////////////
// Informers //
///////////////

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
  if (tag === "try")
    scope[SymbolStackLength] = stack.length;
  if (tag === "closure") {
    scope[SymbolIndex] = 0;
    if (callstack[callstack.length-1][SymbolTag] === "external") {
      scope["@new.target"] = mirror(context["new.target"], "enter-closure-(new.target)", serial);
      scope["@this"] = mirror(context.this, "enter-closure-this", serial);
      for (let index = 0; index < context.length; index++) {
        scope["@"+index] = mirror(context[index], "enter-closure-"+index, serial);
      }
    } else {
      for (let index = context.length-1; index >= 0; index--)
        scope["@"+index] = stack.pop();
      if (context["new.target"]) {
        scope["@this"] = mirror(context.this, "enter-closure-this", serial);
        scope["@new.target"] = stack.pop();
      } else {
        scope["@this"] = stack.pop();
        scope["@new.target"] = mirror(undefined, "enter-closure-(new.target)", serial);
        stack.pop();
      }
    }
  } else if (tag === "program") {
    scope["@this"] = mirror(context.this, "enter-program-this", serial);
  } else if (tag === "catch") {
    scope["@error"] = stack.pop();
  }
};

advice.complete = () => {
  if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure" || scope[SymbolTag] === "eval")
    throw new Error("This should never happen: program/closure/eval without a return");
  scope = Reflect.getPrototypeOf(scope);
};

advice.break = goto;

advice.continue = goto;

///////////////
// Combiners //
///////////////

advice.apply = (value1, value2, values, serial) => {
  if (scopes.has(value1))
    return Reflect.apply(value1, value2, values);
  for (let index = values.length - 1; index >= 0; index--)
    use(stack.pop(), "apply-"+index, serial);
  use(stack.pop(), "apply-this", serial);
  use(stack.pop(), "apply-callee", serial);
  return apply("apply", Reflect.apply, [value1, value2, values]);
};

advice.construct = (value, values, serial) => {
  if (scopes.has(value))
    return Reflect.construct(value, values);
  for (let index = values.length - 1; index >= 0; index--)
    use(stack.pop(), "construct-"+index, serial);
  use(stack.pop(), "construct-callee", serial);
  return apply("construct", Reflect.construct, [value, values]);
};

advice.unary = (operator, value, serial) => {
  use(stack.pop(), "unary-("+operator+")", serial);
  return apply("unary", aran.unary, [value]);
};

advice.binary = (operator, value1, value2, serial) => {
  use(stack.pop(), "binary-("+operator+")-right", serial);
  use(stack.pop(), "binary-("+operator+")-left", serial);
  return apply("binary", aran.binary, [value1, value2]);
};
