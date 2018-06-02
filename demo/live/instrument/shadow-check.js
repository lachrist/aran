
const AranLive = require("aran/live");

const Error = global.Error;
const TypeError = global.TypeError;
const ReferenceError = global.ReferenceError;
const WeakMap = global.WeakMap;
const String = global.String;
const Proxy = global.Proxy;
const eval = global.eval;
const Reflect_apply = global.Reflect.apply;
const Reflect_construct = global.Reflect.construct;
const Object_create = global.Object.create;
const Object_keys = global.Object.keys;
const Object_defineProperty = global.Object.defineProperty;
const Array_prototype_pop = global.Array.prototype.pop;
const Array_prototype_push = global.Array.prototype.push;
const Array_prototype_map = global.Array.prototype.map;
const Array_prototype_concat = global.Array.prototype.concat;
const Array_prototype_unshift = global.Array.prototype.unshift;
const Array_prototype_sort = global.Array.prototype.sort;
const WeakMap_prototype_get = global.WeakMap.prototype.get;
const WeakMap_prototype_set = global.WeakMap.prototype.set;
const WeakMap_prototype_has = global.WeakMap.prototype.has;

const print = (value) => {
  if (typeof value === "function")
    return "function";
  if (typeof value === "object")
    return value ? "object" : "null";
  if (typeof value === "string")
    return JSON.stringify(value);
  return String(value);
};

const cleanup = () => {
  while (cstack.length)
    cstack.pop();
  while (vstack.length)
    vstack.pop();
};

const check = (title, value1, value2, serial) => {
  if (value1 !== value2 && (value1 === value1 || value2 === value2)) {
    throw new Error("["+serial+"] "+title+" mismatch. Expected: "+print(value1)+", got: "+print(value2)+".");
  }
};

// Methods: has, get, set //
const SafeWeakMap = () => {
  const weakmap = new WeakMap();
  weakmap.has = WeakMap_prototype_has;
  weakmap.get = WeakMap_prototype_get;
  weakmap.set = WeakMap_prototype_set;
  return weakmap;
};

// Methods: map, push, pop, peek //
// Attributes: length, 0..length //
const Stack = ((() => {
  function peek () { return this[this.length-1] };
  return () => {
    const stack = [];
    stack.push = Array_prototype_push;
    stack.pop = Array_prototype_pop;
    stack.map = Array_prototype_map;
    stack.peek = peek;
    return stack;
  };
}) ());

// Methods: reify, extend, lookup //
const Scope = ((() => {
  function lookup (identifier, serial) {
    let index = this.length;
    while (index--)
      if (identifier in this[index])
        return this[index][identifier];
    throw new ReferenceError("["+serial+"] Read failure: "+identifier);
  }
  function extend (bindings) {
    return make(this._concat(bindings));
  };
  const make = (array) => {
    array._concat = Array_prototype_concat;
    array.reify = Array_prototype_map;
    array.extend = extend;
    array.lookup = lookup;
    return array;
  }
  return () => make([global]);
}) ());

// Methods: reify, scope, enter, leave, loop, empty //
const Call = ((() => {
  function reify (jsonify) {
    return {
      scope: this._scope.reify(jsonify),
      frames: this._frames.map((frame) => [frame[0], jsonify(frame[1]), frame[2]])
    };
  };
  function getscope () {
    return this._scope;
  };
  function enter (type, binding, custom) {
    const frame = [type, binding, custom];
    this._frames.push(frame);
    return frame;
  }
  function leave (type, serial) {
    check("Leave", (this._frames[this._frames.length-1]||{})[0], type, serial);
    this._frames.pop();
  }
  function loop (callback) {
    let index = this._frames.length;
    while (index--) {
      const frame = this._frames[index];
      if (callback(frame[0], frame[1], frame[2]))
        return true;
    }
    return false;
  }
  return (scope) => ({
    _scope: scope,
    _frames: Stack(),
    reify: reify,
    scope: getscope,
    enter: enter,
    leave: leave,
    loop: loop
  });
}) ());

const advice = {PROXY:Proxy};
const proxies = SafeWeakMap();
const scopes = SafeWeakMap();
const vstack = Stack();
const estack = Stack();
const cstack = Stack();

const produce = (value, serial) => {
  vstack.push(value);
  return value;
}

const consume = (value, serial) => {
  check("Consume-Value", vstack.peek(), value, serial);
  return vstack.pop();
};

global.Proxy = function Proxy (target, handlers) {
  if (new.target === void 0) // https://github.com/jsdom/webidl2js/issues/78
    throw new TypeError("Constructor Proxy requires 'new'");
  const proxy = new Proxy(target, advice);
  proxies.set(proxy, {target:target, handlers:handlers});
  return proxy;
};

///////////////
// Producers //
///////////////
const ftraps = {
  apply: (target, value, values) => {
    if (cstack.length)
      return Reflect.apply(target, value, values);
    try {
      return Reflect.apply(target, value, values);
    } catch (error) {
      cleanup();
      throw error;
    }
  },
  construct: (target, values) => {
    if (cstack.length)
      return Reflect.construct(target, values);
    try {
      return Reflect.construct(target, values);
    } catch (error) {
      cleanup();
      throw error;
    }
  }
};
advice.arrival = (boolean, scope, serial) => {
  cstack.push(Call(scopes.get(scope.callee)));
  cstack.peek().enter("closure", Object_create(null), null);
  return {
    callee: produce(scope.callee),
    new: produce(scope.new),
    this: produce(scope.this),
    arguments: produce(scope.arguments)
  };
};
advice.begin = (boolean, scope, serial) => {
  estack.push(null);
  if (!scope) {
    cstack.peek().enter(boolean ? "closure" : "block", Object_create(null), null);
    return boolean ? "closure" : "block";
  }
  cstack.push(Call(Scope()));
  cstack.peek().enter("block", Object_create(null), null);
  const keys = Reflect_apply(Array_prototype_sort, Object_keys(scope), []);
  let index = keys.length;
  while (index --)
    scope[keys[index]] = produce(scope[keys[index]], serial);
  return scope;
};
advice.regexp = (value, serial) => produce(value, serial);
advice.primitive = (value, serial) => produce(value, serial);
advice.load = (name, value, serial) => produce(value, serial);
advice.discard = (identifier, value, serial) => produce(value, serial);
advice.read = (identifier, value, serial) => {
  let result;
  const each = (type, binding, custom) => {
    if (identifier in binding) {
      result = binding[identifier];
      return true;
    }
  }
  if (!cstack.peek().loop(each))
    result = cstack.peek().scope().lookup(identifier);
  check("Read", result, value, serial);
  return produce(result, serial);
};
advice.closure = (value, serial) => {
  const bindings = [];
  bindings.unshift = Array_prototype_unshift;
  cstack.peek().loop((type, binding, custom) => { bindings.unshift(binding) });
  scopes.set(value, cstack.peek().scope().extend(bindings));
  return produce(new Proxy(value, ftraps), serial);
};
advice.catch = (value, serial) => {
  const each = (type, binding, custom) => {
    cstack.peek().leave(type, serial);
    if (type === "try") {
      cstack.peek().enter("catch", Object_create(null), null);
      while (vstack.length > custom)
        vstack.pop();
      return true;
    }
  }
  while (cstack.length) {
    if (cstack.peek().loop(each))
      return produce(value, serial);
    cstack.pop();
  }
  throw new Error("["+serial+"] Catch failure");
};

///////////////
// Consumers //
///////////////
advice.success = (scope, value, serial) => {
  check("Success", estack.peek(), value, serial);
  if (typeof scope === "string") {
    cstack.peek().leave(scope, serial);
    return produce(value, serial);
  }
  cstack.peek().leave("block", serial);
  if (cstack.peek().loop(() => true))
    throw new Error("["+serial+"] CallStack frames poluted");
  cstack.pop();
  if (estack.length === 1 && (cstack.length || vstack.length))
    throw new Error("["+serial+"] State poluted");
  return value;
};
advice.failure = (scope, error, serial) => {
  if (estack.length === 1)
    cleanup();
  return error;
};
advice.save = (name, value, serial) => consume(value, serial);
advice.test = (value, serial) => consume(value, serial);
advice.throw = (value, serial) => consume(value, serial);
advice.eval = (value, serial) => module.exports(consume(value, serial), serial);
advice.return = (scope, value, serial) => {
  cstack.pop();
  return consume(value, serial);
};
advice.with = (value, serial) => {
  cstack.peek().enter("with", value, null);
  return consume(value, serial);
};
advice.completion = (value, serial) => {
  estack.pop();
  estack.push(value);
  return consume(value, serial);
};
advice.write = (identifier, value, serial) => {
  cstack.peek().loop((type, binding, custom) => {
    if (identifier in binding) {
      if (type !== "with")
        binding[identifier] = value;
      return true;
    }
  });
  return consume(value, serial);
};
advice.declare = (kind, identifier, value, serial) => {
  cstack.peek().loop((type, binding, custom) => {
    if (kind !== "var" || type === "closure") {
      if (type !== "with") {
        Object_defineProperty(binding, identifier, {
          enumerable: true,
          configurable: kind === "var",
          writable: kind !== "const",
          value: value
        });
      }
      return true;
    }
  });
  return consume(value, serial);
};

///////////////
// Informers //
///////////////
advice.end = (serial) => {
  estack.pop();
};
advice.copy = (position, serial) => {
  vstack.push(vstack[vstack.length-position]);
};
advice.swap = (position1, position2, serial) => {
  const temporary = vstack[vstack.length-position1];
  vstack[vstack.length-position1] = vstack[vstack.length-position2];
  vstack[vstack.length-position2] = temporary;
};
advice.drop = (serial) => {
  vstack.pop();
};
advice.block = (serial) => {
  cstack.peek().enter("block", Object.create(null), null);
};
advice.try = (serial) => {
  cstack.peek().enter("try", Object_create(null), vstack.length);
};
advice.finally = (serial) => {
  cstack.peek().enter("finally", Object_create(null), null);
};
advice.label = (boolean, label, serial) => {
  label = (boolean ? "Break" : "Continue") + (label||"");
  cstack.peek().enter("label", Object_create(null), label);
};
advice.leave = (type, serial) => {
  cstack.peek().leave(type, serial);
};
advice.break = (boolean, label, serial) => {
  label = (boolean ? "Break" : "Continue") + (label||"");
  const each = (type, binding, custom) => {
    cstack.peek().leave(type, serial);
    return label === custom;
  }
  if (!cstack.peek().loop(each))
    throw new Error("["+serial+"] Break failure: "+label);    
};

///////////////
// Combiners //
///////////////
advice.invoke = (value1, value2, values, serial) => {
  let index = values.length;
  while (index--)
    consume(values[index], serial);
  consume(value2, serial);
  consume(value1, serial);
  return produce(Reflect_apply(value1[value2], value1, values), serial);
};
advice.construct = (value, values, serial) => {
  let index = values.length;
  while (index--)
    consume(values[index], serial);
  consume(value, serial);
  return produce(new value(...values), serial);
};
advice.apply = (value, values, serial) => {
  let index = values.length;
  while (index--)
    consume(values[index], serial);
  consume(value, serial);
  return produce(value(...values), serial);
};
advice.unary = (operator, value, serial) => {
  consume(value, serial);
  return produce(eval(operator+" value"), serial)
};
advice.binary = (operator, value1, value2, serial) => {
  consume(value2, serial);
  consume(value1, serial);
  return produce(eval("value1 "+operator+" value2"), serial);
};
advice.get = (value1, value2, serial) => {
  consume(value2, serial);
  consume(value1, serial);
  return produce(value1[value2], serial);
};
advice.set = (value1, value2, value3, serial) => {
  consume(value3, serial);
  consume(value2, serial);
  consume(value1, serial);
  return produce(value1[value2] = value3, serial);
};
advice.delete = (value1, value2, serial) => {
  consume(value2, serial);
  consume(value1, serial);
  return produce(delete value1[value2], serial);
};
advice.array = (values, serial) => {
  let index = values.length;
  while (index--)
    consume(values[index], serial);
  return produce(values, serial);
};
advice.object = (properties, serial) => {
  const result = {};
  let index = properties.length
  while (index--) {
    consume(properties[index][1], serial);
    consume(properties[index][0], serial);
    result[properties[index][0]] = properties[index][1];
  }
  return produce(result, serial);
};

module.exports = AranLive(advice).instrument;
