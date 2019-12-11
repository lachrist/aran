
const global_Reflect_apply = global.Reflect.apply;
// const global_Reflect_defineProperty = global.Reflect.defineProperty;
// const global_Symbol_iterator = global.Symbol.iterator;
// const global_Array_prototype_values = global.Array.prototype.values;
const global_WeakMap = global.WeakMap;
const global_WeakMap_prototype_get = global.WeakMap.prototype.get;
const global_WeakMap_prototype_set = global.WeakMap.prototype.set;

const builtins = {
  __proto__:null
};
const stack = [];
const empty = {__proto__: null};
let scope = {
  __proto__: null,
  "%tag": "external",
  "%stack-length": 0
};
let store = new global_WeakMap();
const scopes = new global_WeakMap();
const registers = {
  __proto__: null,
  return: empty,
  throw: empty,
  break: empty,
  continue: empty
};

let counter = 0;
const wrap = (base) => {
  __proto__: null,
  counter: ++counter,
  base: base
};

const set = (value, name) => {
  if (!global_Object_is(register[name], empty)) {
    throw new global_Error("Register should be empty");
  }
  register[name] = value;
  return value;
};

const get = (value, name) => {
  if (!global_Object_is(register[name], value)) {
    throw new global_Error("Register mismatch");
  }
  register[name] = empty;
  return value;
};

const consume = (value) => {
  if (!global_Object_is(stack[stack.length - 1], value)) {
    throw new global_Error("Consume mismatch");
  }
  stack.length--;
  return value;
};

const produce = (value) => {
  stack[stack.length] = value;
  return value;
};

const external = (closure) => {
  callstack.push(scope);
  scope = {
    __proto__: null,
    [SymbolTag]: "external",
    [SymbolStackLength]: stack.length
  };
  try {
    return produce(closure());
  } catch (value) {
    throw set("error", value);
  } finally {
    scope = callstack[callstack.length - 1];
    callstack.length--;
  }
};

///////////////
// Producers //
///////////////

advice.read = (meta, hidden, identifier, serial) => {
  if (scope[(hidden ? "_" : "$") + identifier] !== meta) {
    throw new global_Error("Read mismatch");
  }
  stack[stack.length] = meta;
  return meta;
};

advice.primitive = (base, serial) => {
  const meta = wrap(base);
  stack[stack.length] = meta;
  return meta;
};

advice.closure = (base, serial) => {
  global_Reflect_apply(global_WeakMap_prototype_set, scopes, [base, scope]);
  const meta = wrap(base);
  stack[stack.length] = meta;
  return meta;
};

advice.builtin = (base, name) => {
  if (name in builtins) {
    if (!global_Object_is(builtins[name].base, base)) {
      throw new global_Error("Builtin mismatch");
    }
  } else {
    builtins[name] = wrap(base);
  }
  stack[stack.length] = builtins[name];
  return builtins[name];
};

advice.parameter = (meta, name, serial) => {
  if (scope["@" + name] !== meta)) {
    throw new global_Error("Parameter mismatch");
  }
  stack[stack.length] = meta;
  return meta;
};

///////////////
// Consumers //
///////////////

advice.drop = (meta, serial) => {
  if (stack[stack.length - 1] !== meta) {
    throw new global_Error("Drop mismatch");
  }
  stack.length--;
  return meta.base;
};

advice.test = (meta, serial) => {
  if (stack[stack.length - 1] !== meta) {
    throw new global_Error("Test mismatch");
  }
  stack.length--;
  return meta.base;
};
  
advice.write = (meta, hidden, identifier, serial) => {
  if (stack[stack.length - 1] !== meta) {
    throw new global_Error("Write mismatch");
  }
  stack.length--;
  scope[(hidden ? "_" : "$") + identifier] = meta;
  return meta;
};

advice.eval = (meta, serial) => {
  if (stack[stack.length - 1] !== meta) {
    throw new global_Error("Eval mismatch");
  }
  stack.length--;
  return aran.instrument(meta.base, serial);
};

advice.throw = (value, serial) => {
  if (stack[stack.length - 1] !== meta) {
    throw new global_Error("Throw mismatch");
  }
  stack.length--;
  if (register.throw === empty) {
    throw new global_Error("Non-empty throw register");
  }
  regisiter.throw = meta;
};

advice.return = (value, serial) => {
  if (stack[stack.length - 1] !== meta) {
    throw new global_Error("Throw mismatch");
  }
  stack.length--;
  if (register.return === empty) {
    throw new global_Error("Non-empty throw register");
  }
  regisiter.return = meta;
}

///////////////
// Combiners //
///////////////

advice.object = (prototype, entries) => {
  for (let index = entries.length - 1; index >= 0; index--) {
    consume(entries[index][1]);
    consume(entries[index][0]);
  }
  consume(prototype);
  const value = {__proto__:prototype};
  for (let index = 0; index < entries.length; index++) {
    value[entries[index][0]] = entries[index][1];
  }
  return produce(value);
};

advice.apply = (value1, value2, values, serial) => {
  if (global_Reflect_apply(global_WeakMap_prototype_has, scopes, [value1])) {
    return global_Reflect_apply(value1, value2, values);
  }
  for (let index = values.length - 1; index >= 0; index--) {
    consume(values[index]);
  }
  consume(value2);
  consume(value1);
  return external(() => global_Reflect_apply(value1, value2, values));
};

advice.construct = (value, values, serial) => {
  if (global_Reflect_apply(global_WeakMap_prototype_has, scopes, [value])) {
    return global_Reflect_construct(value, values);
  }
  for (let index = values.length - 1; index >= 0; index--) {
    consume(values[index]);
  }
  consume(value);
  return external(() => global_Reflect_construct(value, values));
};

advice.binary = (operator, value1, value2, serial) => {
  consume(value2);
  consume(value1);
  return external(() => aran.binary(operator, value1, value2));
};

advice.unary = (operator, value, serial) => {
  consume(value);
  return external(() => aran.unary(operator, value));
};

//////////////
// Informer //
//////////////

advice.break = (label, serial) => {
  if (register.break !== empty) {
    throw new global_Error("Non-empty break register");
  }
  register.break = label;
};

advice.continue = (label, serial) => {
  if (register.continue !== empty) {
    throw new global_Error("Non-empty continue register");
  }
  register.continue = label;
};

advice.enter = (tag, labels, parameters, identifiers1, identifiers2, serial) => {
  if (tag === "program") {
    if (scope["%tag"] !== "external") {
      throw new Error("Invalid root scope");
    }
    callstack[callstack.length] = scope;
    scope = null;
  } else if (tag === "closure") {
    callstack[callstack.length] = scope;
    scope = global_Reflect_apply(global_WeakMap_prototype_get, scopes, [parameters.callee]);
  }
  scope = {
    __proto__: scope,
    ["%tag"] = tag,
    ["%labels"] = labels,
    ["%stack-length"] = stack.length,
    ["%callstack-length"] = callstack.length
  };
  for (let index = 0; index < identifiers1.length; index++) {
    scope["_" + identifier] = empty;
  }
  for (let index = 0; index < identifiers2.length; index++) {
    scope["$" + identifier] = empty;
  }
  if (tag === "catch") {
    if (regisiter.error !== parameter.error) {
       throw new global_Error("Error register mismatch");
    }
    regisiter.error = empty;
    scope["@error"] = parameter.error;
  } else if (tag === "program") {
    if (parameter.this !== global) {
      throw new global_Error("This should be set to global");
    }
    if (!("global" in builtins)) {
      builtins.global = {__proto__:null, base:global};
    }
    scope["@this"] = builtins.global;
  } else if (tag === "closure") {
    if (callstack[callstack.length - 1]["%tag"] !== "external") {
      for (let index = parameter.arguments.length - 1; index >= 0; index--) {
        consume(parameter.arguments[index]);
      }
      if (parameter["new.target"] !== void 0) {
        consume(parameter.this);
      }
      consume(parameter.callee);
    }
    scope["@callee"] = parameter.callee;
    scope["@new.target"] = parameter["new.target"];
    scope["@this"] = parameter.this;
    scope["@arguments"] = parameter.arguments;
  }
};

advice.completion = (serial) => {
  set("completion", null);
};

advice.leave = (serial) => {
  {
    const sum = 0;
    for (let key in register) {
      if (register[key] !== empty) {
        sum += 1;
      }
    }
    if (sum !== 1) {
      throw new global_Error("There should exactly be one non-empty register.")
    }
  }
  const tag = scope[SymbolTag];
  const labels = scope[SymbolLabels];
  scope = global_Reflect_getPrototypeOf(scope);
  if (register.break !== empty || regisiter.continue !== empty) {
    for (let index = 0; index < labels; index++) {
      if (labels[index] === register.break) {
        register.break = empty;
        return;
      }
      if (scope[SymbolLabels][index] === register.continue) {
        register.continue = empty;
        if (scope[SymbolTag] !== "while") {
          throw new global_Error("Matched continue label in non-while block");
        }
        return;
      }
    }
  }
  if (register.error !== empty) {
    throw new global_Error("Register error should be empty when leaving blocks");
  }
  if (register.throw !== empty) {
    if (scope[SymbolTag] === "try") {
      regisiter.error = register.throw;
      regisiter.throw = empty;
    }
  }
  if (regisiter.return !== empty) {
    if (scope[SymbolTag] === "closure") {
      if (callstack[callstack.length - 1] )
    }
  }
  
  if (scope[SymbolTag] === "closure") {
    if (register.throw === "")
  }
  
    if (regisiter.)
    
    if (regisiter.throw !== empty) {
      
    }
    
    if (register.continue !== empty) {
      for (let index = 0; index < scope[SymbolLabels]; index++) {
        if (scope[SymbolLabels][index] === register.break) {
          return;
        }
      }
    }
  } finally {
    scope = global_Reflect_
  }
  
}
