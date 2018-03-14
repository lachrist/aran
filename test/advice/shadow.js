
const PrintLite = require("print-lite");
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
const Object_defineProperty = global.Object.defineProperty;
const Array_prototype_pop = global.Array.prototype.pop;
const Array_prototype_push = global.Array.prototype.push;
const Array_prototype_map = global.Array.prototype.map;
const Array_prototype_concat = global.Array.prototype.concat;
const Array_prototype_unshift = global.Array.prototype.unshift;
const WeakMap_prototype_get = global.WeakMap.prototype.get;
const WeakMap_prototype_set = global.WeakMap.prototype.set;
const WeakMap_prototype_has = global.WeakMap.prototype.has;

const check = (title, value1, value2, serial) => {
  if (value1 !== value2 && (value1 === value1 || value2 === value2)) {
    throw new Error("["+serial+"] "+title+" mismatch. Expected: "+PrintLite(value1)+", got: "+PrintLite(value2)+".");
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
  function loop (closure) {
    let index = this._frames.length;
    while (index--) {
      const frame = this._frames[index];
      if (closure(frame[0], frame[1], frame[2]))
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

module.exports = (aran, join) => {

  const traps = {};
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
    const proxy = new Proxy(target, traps);
    proxies.set(proxy, {target:target, handlers:handlers});
    return proxy;
  };

  /////////////
  // Special //
  /////////////

  traps.copy = (position, value, serial) => {
    vstack.push(vstack[vstack.length-position]);
    return value;
  };
  traps.swap = (position1, position2, value, serial) => {
    const temporary = vstack[vstack.length-position1];
    vstack[vstack.length-position1] = vstack[vstack.length-position2];
    vstack[vstack.length-position2] = temporary;
    return value;
  };
  traps.drop = (value, serial) => {
    vstack.pop();
    return value;
  };

  ///////////////
  // Producers //
  ///////////////

  traps.this = (value, serial) => produce(value, serial);
  traps.newtarget = (value, serial) => produce(value, serial);
  traps.arguments = (value, serial) => produce(value, serial);
  traps.regexp = (value, serial) => produce(value, serial);
  traps.primitive = (value, serial) => produce(value, serial);
  traps.builtin = (identifier, value, serial) => produce(value, serial);
  traps.discard = (identifier, value, serial) => produce(value, serial);
  traps.callee = (value, serial) => {
    cstack.push(Call(scopes.get(value)));
    cstack.peek().enter("closure", Object.create(null), null);
    return produce(value, serial);
  };
  traps.read = (identifier, value, serial) => {
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
  traps.closure = (value, serial) => {
    let wrapper = function () {
      if (cstack.length)
        return new.target ? Reflect_construct(value, arguments) : Reflect_apply(value, this, arguments);
      try {
        var result = new.target ? Reflect_construct(value, arguments) : Reflect_apply(value, this, arguments);
      } catch (error) {
        while (cstack.length)
          cstack.pop();
        while (vstack.length)
          vstack.pop();
        throw error;
      }
      if (cstack.length || vstack.length || estack.length)
        throw new Error("["+serial+"] State poluted");
      return result;
    };
    const bindings = [];
    bindings.unshift = Array_prototype_unshift;
    cstack.peek().loop((type, binding, custom) => { bindings.unshift(binding) });
    scopes.set(wrapper, cstack.peek().scope().extend(bindings));
    return produce(wrapper, serial);
  };
  traps.catch = (value, serial) => {
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

  traps.test = (value, serial) => consume(value, serial);
  traps.throw = (value, serial) => consume(value, serial);
  traps.eval = (value, serial) => join(consume(value, serial), aran.node(serial));
  traps.return = (value, serial) => {
    cstack.pop();
    return consume(value, serial);
  };
  traps.with = (value, serial) => {
    cstack.peek().enter("with", value, null);
    return consume(value, serial);
  };
  traps.completion = (value, serial) => {
    estack.pop();
    estack.push(value);
    return consume(value, serial);
  };
  traps.write = (identifier, value, serial) => {
    const each = (type, binding, custom) => {
      if (identifier in binding) {
        if (type !== "with")
          binding[identifier] = value;
        return true;
      }
    }
    if (!cstack.peek().loop(each) && aran.node(serial).AranStrict)
      throw new Error("["+serial+"] Write failure: "+identifier);
    return consume(value, serial);
  };
  traps.declare = (kind, identifier, value, serial) => {
    cstack.peek().loop((type, binding, custom) => {
      if (kind !== "var" || type === "closure") {
        if (type === "with")
          throw new Error("["+serial+"] Illegal with frame");
        Object_defineProperty(binding, identifier, {
          enumerable: true,
          configurable: kind === "var",
          writable: kind !== "const",
          value: value
        });
        return true;
      }
    });
    return consume(value, serial);
  };

  ///////////////
  // Informers //
  ///////////////

  traps.block = (serial) => {
    cstack.peek().enter("block", Object.create(null), null);
  };
  traps.try = (serial) => {
    cstack.peek().enter("try", Object_create(null), vstack.length);
  };
  traps.finally = (serial) => {
    cstack.peek().enter("finally", Object_create(null), null);
  };
  traps.label = (boolean, label, serial) => {
    label = (boolean ? "Break" : "Continue") + (label||"");
    cstack.peek().enter("label", Object_create(null), label);
  };
  traps.leave = (type, serial) => {
    cstack.peek().leave(type, serial);
  };
  traps.break = (boolean, label, serial) => {
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

  traps.invoke = (value1, value2, values, serial) => {
    let index = values.length;
    while (index--)
      consume(values[index], serial);
    consume(value2, serial);
    consume(value1, serial);
    return produce(Reflect_apply(value1[value2], value1, values), serial);
  };
  traps.construct = (value, values, serial) => {
    let index = values.length;
    while (index--)
      consume(values[index], serial);
    consume(value, serial);
    return produce(Reflect_construct(value, values), serial);
  };
  traps.apply = (boolean, value, values, serial) => {
    let index = values.length;
    while (index--)
      consume(values[index], serial);
    consume(value, serial);
    return produce(Reflect_apply(value, boolean ? void 0 : global, values), serial);
  };
  traps.unary = (operator, value, serial) => {
    consume(value, serial);
    return produce(eval(operator+" value"), serial)
  };
  traps.binary = (operator, value1, value2, serial) => {
    consume(value2, serial);
    consume(value1, serial);
    return produce(eval("value1 "+operator+" value2"), serial);
  };
  traps.get = (value1, value2, serial) => {
    consume(value2, serial);
    consume(value1, serial);
    return produce(value1[value2], serial);
  };
  traps.set = (value1, value2, value3, serial) => {
    consume(value3, serial);
    consume(value2, serial);
    consume(value1, serial);
    return produce(value1[value2] = value3, serial);
  };
  traps.delete = (value1, value2, serial) => {
    consume(value2, serial);
    consume(value1, serial);
    return produce(delete value1[value2], serial);
  };
  traps.array = (values, serial) => {
    let index = values.length;
    while (index--)
      consume(values[index], serial);
    return produce(values, serial);
  };
  traps.object = (properties, serial) => {
    const result = {};
    let index = properties.length
    while (index--) {
      consume(properties[index][1], serial);
      consume(properties[index][0], serial);
      result[properties[index][0]] = properties[index][1];
    }
    return produce(result, serial);
  };

  //////////////////////
  // Setup / Teardown //
  //////////////////////

  traps.begin = (serial) => {
    estack.push(null);
    if (aran.node(serial).AranParent)
      return cstack.peek().enter(aran.node(serial).AranStrict ? "closure" : "block", Object_create(null), null);
    cstack.push(Call(Scope()));
    cstack.peek().enter("block", Object_create(null), null);
  };
  traps.success = (value, serial) => {
    check("Success", estack.peek(), value, serial);
    if (aran.node(serial).AranParent) {
      cstack.peek().leave(aran.node(serial).AranStrict ? "closure" : "block", serial);
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
  traps.failure = (error, serial) => {
    if (estack.length === 1) {
      while (cstack.length)
        cstack.pop();
      while (vstack.length)
        vstack.pop();
    }
    return error;
  };
  traps.end = (serial) => {
    estack.pop();
  };

  ////////////
  // Return //
  ////////////

  return {
    traps: traps,
    vstack: vstack,
    cstack: cstack,
    estack: estack,
    proxies: proxies,
    scopes: scopes
  };

};