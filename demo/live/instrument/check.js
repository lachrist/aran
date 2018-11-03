
// Limitations:
// - Not transparent if with object is a proxy or contains getters/setters.
// - Not transparent if global object contains getters/setters.
// - Errors might remain undetected if try block does not throw unexpected error.

const undeclared = Symbol("undeclared");

const nameof = new WeakMap();

const print = (value) => {
  if (Array_isArray(value))
    return "array";
  if (typeof value === "object")
    return value ? "object" : "null";
  if (typeof value === "function")
    return "function";
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
}

const mismatch = (value1, value2) => {
  if (value1 !== value2)
    throw new Error("Value mismatch: expected "+print(value1)+", got "+print(value2));
};

const consume = (value1) => mismatch(value, vstack.pop());

const produce = (value) => vstack.push(value);


// Normally variable declaration are hoisted so the
// the current frame shoud always be a closure frame.
// Two exeception:
//   - direct eval call in non-strict mode
//   - program in non-strict mode
ADVICE.declare = (kind, identifier, value, serial) => {
  const frame = scope;
  if (kind === "var") {
    while (frame[symbols.name] !== "closure") {
      frame = Reflect.getPrototypeOf(frame);
      if (frame[symbols.name] === "global") {
        return value;
      }
    }
  }
  Object.defineProperty(frame, identifier, {
    value: value,
    writable: kind !== "const",
  });
  return value;
};


// o = {x:"bar"};
// p = new Proxy(o, {
//   getPrototypeOf: (t) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(t)),
//   setPrototypeOf: (t, p) => (console.log("setPrototypeOf"), Reflect.setPrototypeOf(t, p)),
//   isExtensible: (t) => (console.log("isExtensible"), Reflect.isExtensible(t)),
//   preventExtensions: (t) => (console.log("preventExtensions"), Reflect.preventExtensions(t)),
//   getOwnPropertyDescriptor: (t, k) => (console.log("getOwnPropertyDescriptor", k), Reflect.getOwnPropertyDescriptor(t, k)),
//   defineProperty: (t, k, d) => (console.log("defineProperty", k, Object.getOwnPropertyDescriptors(d)), Reflect.defineProperty(t, k, d)),
//   has:(t, k) => (console.log("has", k), k in t),
//   get: (t, k, r) => (console.log("get", k), assert(r === p), Reflect.get(t,k,r)),
//   set: (t, k, v, r) => (console.log("set", k, v), assert(r === p), Reflect.set(t,k,v,r)),
//   deleteProperty: (t, k) => (console.log("deleteProperty", k), Reflect.deleteProperty(t, k)),
//   ownKeys: (t) => (console.log("ownKeys"), Reflect.ownKeys(t)),
//   apply: (t, x, xs) => (console.log("apply"), Reflect.apply(t, x, xs)),
//   construct: (t, xs) => (console.log("construct"), Reflect.construct(t, xs))
// });
// Reflect.set(p, "x", 1, p);

// with (p) { x = 1 }

// Object.defineProperty(Object.getPrototypeOf(global), "foo", {
//   get: function  () {
//     assert(this === global);
//     return "foo"
//   }
// });

ADVICE.enter = (tag, identifiers, serial) => {
  if (name === "catch") {
    while (scope[SymbolTag] !== "try") {
      if (scope[SymbolTag] === "closure") {
        scope = cstack.pop();
      } else {
        scope = Reflect.getPrototypeOf(scope);
      }
    }
  }
  scope = Object.create(scope);
  for (let index = 0; index < identifiers.length, index++)
    scope[identifier] = undeclared;
  scope[SymbolTag] = tag;
};

ADVICE.leave = (serial) => {
  scope.pop();
  if (nameof.get(scope[scope.length-1]) === "with")
    scope.pop();
};

ADVICE.arrival = (callee, serial) => {
  callstack.push(scope);
  scope = Object.create(scopes.get(callee));
  scope[SymbolTag] = "closure";
};

ADVICE.return = (value, serial) => {
  scope = callstack.pop();
};

// ADVICE.with = (value, serial) => {
//   nameof.set(value, "with");
//   scope.push(value);
// }

ADVICE.read = (identifier, serial) => {
  const value = scope[identifier];
  if (value === SymbolUndeclared)
    return signal(new ReferenceError(identifier+" is not defined"));
  return value;
};


ADVICE.read = (identifier, serial) => {
  for (let index = scope.length-1; index >= 0; index--) {
    if (identifier in scope[index]) {
      if (nameof.get(scope[index]) !== "with")
        return Reflect.get(scope[index], identifier, scope[index]);
      const unscopables = scope[index][Symbol.unscopables];
      if (unscopables && !unscopables[identifier]) {
        return Reflect.get(scope[index], identifier, scope[index]);
      }
    }
  }
  let frame = global2;
  while (frame) {
    if (Reflect.ownKeys(frame).includes(identifier))
      return Reflect.get(frame, identifier, global);
    frame = Reflect.getPrototypeOf(frame);
  }
  throw new ReferenceError(identifier+" is not defined");
};

ADVICE.write = (strict, identifier, value, serial) => {
  for (let index = scope.length-1; index >= 0; index--) {
    if (identifier in scope[index]) {
      if (nameof.get(scope[index]) !== "with")
        return (Reflect.set(scope[index], identifier, value, scope[index]), undefined);
      const unscopables = scope[index][Symbol.unscopables];
      if (unscopables && !unscopables[identifier]) {
        if (Reflect.set(scope[index], identifier, value, scope[index]) || !strict)
          return undefined;
        throw new TypeError("Cannot assign property '"+identifier+"' of object "+Object.prototype.toString.call(scope[index]))
      }
    }
  }
  if (strict) {
    let frame = global2;
    while (frame) {
      if (Reflect.ownKeys(frame).includes(identifier)) {
        if (Reflect.set(frame, identifier, value, global2))
          return undefined;
        throw new TypeError("Cannot assign property '"+identifier+"' of object "+Object.property.toString.call(frame))
      }
      frame = Reflect.getPrototypeOf(frame);
    }
    throw new TypeError(identifier+" is not defined");
  } else {
    Reflect.set(global2, identifier, value, global2);
  }
};

ADVICE.enter = (name, identifiers, serial) => {
  if (name === "catch") {
    while (scope[symbols.name] !== "try") {
      if (scope[symbols.name] === "closure") {
        scope = cstack.pop();
      } else {
        scope = Object.getPrototypeOf(scope);
      }
    }
  }
  scope = Object.create(scope);
  identifiers.forEach((identifier) => Object.defineProperty(scope, identifier, {
    value: symbols.undeclared,
    configurable: true
  }));
  scope[symbols.name] = name;
  scope[symbols.serial] = serial;
};

ADVICE.leave = (name, serial) => {
  if (scope[SymbolName] !== name)
    signal("name mismatch");
  if (scope[SymbolSerial] !== serial)
    signal("serial mismatch");
  scope = Object.getPrototypeOf(scope);
  if (scope[symbols.name] === "with")
    scope = Object.getPrototypeOf(scope);
};

ADVICE.break = (name, serial) => {
  while (scope[symbols.name] !== name) {
    if (scope[symbols.name] === "closure") {
      throw new Error("label lookup hit a closure, this should have raised a syntactic error");
    }
    scope = Object.getPrototypeOf(scope);
  }
};

ADVICE.closure = (value1, serial) => {
  scopes.set(value1, scope);
  const value2 = function () {
    if (scope)
      return new.target ?
        Reflect.construct(value, arguments) :
        Reflect.apply(value, this, arguments);
    try {
      return new.target ?
        Reflect.construct(value, arguments) :
        Reflect.apply(value, this, arguments);
    } catch (error) {
      cstack = [];
      vstack = [];
      scope = null;
      throw error;
    }
  }
  vstack.push(value2);
  return value2;
};






ADVICE.prexisting = (name, value, serial) => {
  if (name === "error") {
    if (value )
  }
};


