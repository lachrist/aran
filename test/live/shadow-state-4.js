
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
const stack = {
  _array: [],
  push: function (value) {
    this._array.push(value);
  },
  pop: function () {
    return this._array.pop();
  },
  peek: function () {
    return this._array[this._array.length-1];
  }
};
const store = {
  _weakmap: new WeakMap(),
  register: function (base, metas) {
    Object.freeze(base);
    Object.freeze(metas);
    this._weakmap.set(base, metas);
  },
  fetch: function (base, key) {
    const metas = this._weakmap.get(base);
    if (metas && key in metas)
      return metas[key];
    throw new Error("Missing entry");
  }
};

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

// const exception = (meta) => {
//   while (scope[SymbolTag] !== "try" && scope[SymbolTag] !== "external") {
//     if (scope[SymbolTag] === "closure" || scope[SymbolTag] === "program") {
//       scope = callstack.pop();
//     } else {
//       scope = Reflect.getPrototypeOf(scope);
//     }
//   }
//   while (stack.length > scope[SymbolStackLength])
//     stack.pop();
//   if (scope[SymbolTag] === "try") {
//     stack.push(meta);
//     scope = Reflect.getPrototypeOf(scope);
//   }
// };

// const goto = (label) => {
//   while (!scope[SymbolLabels].includes(label)) {
//     if (scope[SymbolTag] === "program" || scope[SymbolTag] === "closure" || scope[SymbolTag] === "eval")
//       throw new Error("This should never happen: unmatched label");
//     scope = Reflect.getPrototypeOf(scope);
//   }
// };

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
    return base;
  } catch (base) {
    stack.push(mirror(base, name+"-error", serial));
    throw base;
  } finally {
    scope = callstack.pop();
  }
};

///////////////
// Producers //
///////////////

advice.primitive = (base, serial) => {
  stack.push(mirror(base, "primitive", serial));
  return base;
};

advice.builtin = (base, name, serial) => {
  stack.push(mirror(base, "builtin-("+name+")", serial));
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

advice.parameter = (base, name, serial) => {
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

// advice.throw = (base, serial) => {
//   exception(stack.pop());
//   return base;
// };

advice.eval = (base, serial) => {
  use(stack.pop(), "eval", serial);
  return aran.weave(Acorn.parse(base), pointcut, serial);
};

// advice.return = (base, serial) => {
//   if (scope[SymbolTag] === "external")
//     use(stack.pop(), "return", serial);
//   return base;
// };

///////////////
// Informers //
///////////////

// const store = {
//   _weakmap: new WeakMap(),
//   get: function (base, key) {
//     const metas = this._
//   }
//   has: (base, key) => store.has(base) && key in store.get(base),
//   get: (base, key) => 
// };

// const {register, fetch} => ((() => {
//   const store = new WeakMap();
//   return {
//     register: (base, metas) => {
//       Object.freeze(base);
//       Object.freeze(metas);
//       store.set(base, metas);
//     },
//     has: (base, key) => {
// 
//     }
//     fetch: (base, key) => {
//       if (key)
//     }
//   }
//   return {register, fetch};
// }) ());

advice.enter = (tag, parameters, labels, identifiers1, identifiers2, serial) => {
  if (tag === "closure" || tag === "program") {
    callstack.push(scope);
    if (tag === "closure") {
      scope = scopes.get(identifiers["@callee"]);
    } else {
      scope = null;
    }
  }
  scope = Object.create(scope);
  scope[SymbolTag] = tag;
  scope[SymbolStackLength] = stack.length;
  if (tag === "closure") {
    if (callstack[callstack.length-1][SymbolTag] === "external") {
      scope["@callee"] = mirror(parameter["callee"], "enter-closure-callee", serial);
      scope["@new.target"] = mirror(parameter["new.target"], "enter-closure-(new.target)", serial);
      scope["@this"] = mirror(parameter["this"], "enter-closure-this", serial);
      scope["@arguments"] = mirror(parameter["arguments"], "enter-closure-arguments", serial);   
    } else {
      const metas = {__proto__:null};
      for (let index = bases.length - 1; index >= 0; index--) {
        metas[index] = stack.pop();
      }
      store.register(frame["@arguments"], metas);
      // const bases = scope["@arguments"];
      // const metas = new Array(bases.length);
      // for (let index = bases.length - 1; index >= 0; index--) {
      //   metas[index] = stack.pop();
      // }
      // frame["@arguments"] = {
      //   [Symbol.iterator] => () => {
      //     let index = -1;
      //     return {
      //       next: () => {
      //         if (index + 1 >= bases.length) {
      //           return {done:true};
      //         }
      //         index++;
      //         const result = {done:false};
      //         Reflect.defineProperty(result, "value", {
      //           __proto__: null,
      //           value:base[index]
      //         });
      //         metas.set(result, metas[index]);
      //         return result;
      //       }
      //     }
      //   }
      // };
      scope["@arguments"] = mirror(frame["@arguments"], "enter-closure-arguments", serial);
      if (scope["@new.target"] !== undefined) {
        scope["@this"] = mirror(frame["@this"], "enter-closure-this", serial);
        scope["@new.target"] = stack.pop();
        scope["@callee"] = scope["@new.target"];
      } else {
        scope["@this"] = stack.pop();
        scope["@new.target"] = mirror(frame["@new.target"], "enter-closure-(new.target)", serial);
        scope["@callee"] = stack.pop();
      }
    }
  } else if (tag === "program") {
    scope["@this"] = mirror(frame["@this"], "enter-program-this", serial);
  } else if (tag === "catch") {
    scope["@error"] = stack.pop();
  }
  for (key in frame) {
    if (key[0] !== "@") {
      scope[key] = mirror(scope[key], "enter-"+key, serial);
    }
  }
  return frame;
};

advice.leave = (serial) => {
  if (scope[SymbolTag] === "program") {
    scope = callstack.pop();
    stack.pop();
  } else if (scope[SymbolTag] === "closure") {
    scope = callstack.pop();
    if (scope[SymbolTag] === "external") {
      stack.pop();
    }
  } else {
    scope = Reflect.getPrototypeOf(scope);
  }
};

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
  if (value1 === Reflect.get) {
    try {
      stack.push(store.fetch(values[0], values[1]));
      return Reflect.get(values[0], values[1]);
    } catch (error) {}
  }
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
