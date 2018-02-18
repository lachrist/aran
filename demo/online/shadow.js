
const Print = require("./util/print.js");

const String = global.String;
const WeakMap = global.WeakMap;
const TypeError = global.TypeError;
const ReferenceError = global.ReferenceError;
const Error = global.Error;
const Proxy = global.Proxy;
const Function = global.Function;
const eval = global.eval;
const $eval = global.eval;
const JSON_stringify = global.JSON.stringify;
const Reflect_apply = global.Reflect.apply;
const Reflect_construct = global.Reflect.construct;
const Object_create = global.Object.create;
const Object_defineProperty = global.Object.defineProperty;
const Object_getPrototypeOf = global.Object.getPrototypeOf;
const Object_getOwnPropertyDescriptors = global.Object.getOwnPropertyDescriptors;
const Object_values = global.Object.values;
const Object_keys = global.Object.keys;
const Array_isArray = global.Array.isArray;
const Array_prototype_map = global.Array.prototype.map;
const Array_prototype_forEach = global.Array.prototype.forEach;
const WeakMap_prototype_get = global.WeakMap.prototype.get;
const WeakMap_prototype_set = global.WeakMap.prototype.set;
const WeakMap_prototype_has = global.WeakMap.prototype.has;

const naming = new WeakMap();
[
  "global",
  "Object.prototype",
  "Array.prototype",
  "Function.prototype",
  "String.prototype",
  "Boolean.prototype",
  "Error.prototype"
].forEach((name) => {
  naming.set(eval(name), ["builtin", name]);
});

module.exports = (aran, join) => {

  const proxies = new WeakMap();
  const sanitize = ((() => {
    const substitutes = new WeakMap();
    Reflect_apply(WeakMap_prototype_set, substitutes, [Function, function Function () {
      if (arguments.length === 0) {
        var script = "function anonymous() {\n\n}";
      } else if (arguments.length === 1) {
        var script = "function anonymous() {\n"+arguments[0]+"\n}";
      } else {
        var script = "function anonymous("+arguments[0];
        for (let index=1, last = arguments.length-1; index < last; index++)
          script += ","+arguments[index];
        script += "\n/*``*/){\n"+arguments[arguments.length-1]+"\n}";
      }
      return $eval(join(script, null));
    }]);
    Reflect_apply(WeakMap_prototype_set, substitutes, [eval, function eval (script) {
      return $eval(join(script, null));
    }]);
    Reflect_apply(WeakMap_prototype_set, substitutes, [Proxy, function Proxy (target, traps) {
      if (new.target === void 0) // https://github.com/jsdom/webidl2js/issues/78
        throw new TypeError("Constructor Proxy requires 'new'");
      const proxy = new Proxy(target, traps);
      Reflect_apply(WeakMap_prototype_set, proxies, [proxy, {target:target, traps:traps}]);
      return proxy;
    }]);
    return sanitize = (value) => (
      Reflect_apply(WeakMap_prototype_has, substitutes, [value]) ?
      Reflect_apply(WeakMap_prototype_get, substitutes, [value]) :
      value);
  }) ());

  ///////////
  // State //
  ///////////

  const completions = [];
  const values = [];
  const calls = [];
  const scopes = new WeakMap();

  ///////////
  // Stack //
  ///////////

  const produce = (value, serial) => {
    values[values.length] = value;
    return null;
  };

  const consume = () => {
    const value = values[values.length-1];
    values.length--;
    return value;
  };

  /////////////////
  // Environment //
  /////////////////

  const traps = {};

  //////////////
  // Specials //
  //////////////

  traps.swap = (position1, position2, value, serial) => {
    const temporary = values[values.length-position1];
    values[values.length-position1] = values[values.length-position2];
    values[values.length-position2] = temporary;
    return value;
  };

  traps.copy = (position, value, serial) => {
    values[values.length] = values[values.length-position];
    return value;
  };

  traps.drop = (value, serial) => {
    values.length--;
    return value;
  };

  ///////////////
  // Producers //
  ///////////////

  traps.read = (identifier, value, serial) => {
    const call = calls[calls.length-1];
    let index = call.frames.length;
    while (index--) {
      const binding = call.frames[index].binding;
      if (identifier in binding) {
        return binding === "global" ? sanitize(binding[identifier]) : binding[identifier];
      }
    }
    index = call.scope.length;
    while (index--) {
      const binding = call.scope[index];
      if (identifier in binding) {
        return binding === "global" ? sanitize(binding[identifier]) : binding[identifier];
      }
    }
    throw new ReferenceError(identifier+" is not defined");
  };

  traps.builtin = (identifier, value, serial) => produce(value, serial);

  traps.this = (value, serial) => produce(value, serial);

  traps.newtarget = (value, serial) => produce(value, serial);

  traps.arguments = (values, serial) => produce(values, serial);

  traps.primitive = (value, serial) => produce(value, serial);

  traps.regexp = (value, serial) => produce(value, serial);

  traps.closure = (value, serial) => {
    let wrapper = function () {
      if (calls.length)
        return new.target ? Reflect_construct(value, arguments) : Reflect_apply(value, this, arguments);
      try {
        var result = new.target ? Reflect_construct(value, arguments) : Reflect_apply(value, this, arguments);
      } catch (error) {
        calls.length = 0;
        values.length = 0;
        throw error;
      }
      return result;
    };
    const call = calls[calls.length-1];
    const scope = [];
    for (var index = 0, length = call.scope.length; index < length; index++)
      scope[index] = call.scope[index];
    for (var index = 0, length = call.frames.length; index < length; index++)
      scope[scope.length] = call.frames[index].binding;
    Reflect_apply(WeakMap_prototype_set, scopes, [wrapper, scope]);
    return produce(wrapper, serial);
  };

  traps.discard = (identifier, value, serial) => produce(value, serial);

  traps.catch = (value, serial) => {
    while (calls.length) {
      const frames = calls[calls.length-1].frames;
      while (frames.length) {
        const frame = leave();
        if (frame.type === "try") {
          enter("catch", serial, Object_create(null));
          values.length = frame.restore;
          return produce(value, serial);
        }
      }
      calls.return()
      calls.length--
    }
    throw new Error("Catch unmatched by try (this should never happen)");
  };

  ///////////////
  // Consumers //
  ///////////////

  traps.test = (value, serial) => consume(value, serial);

  traps.throw = (value, serial) => consume(value, serial);

  traps.completion = (value, serial) => completions[completions.length-1] = consume(value, serial);

  traps.return = (value, serial) => {
    calls.length--;
    return consume(value, serial);
  };

  traps.write = (identifier, value, serial) => {
    const frames = calls[calls.length-1].frames;
    let index = frames.length;
    while (index--) {
      if (identifier in frames[index].binding) {
        if (frames[index].type !== "with")
          frames[index].binding[identifier] = value;
        return consume(value, serial);
      }
    }
    if (aran.node(serial).AranStrict)
      throw new Error("["+serial+"] Write failure: "+identifier+".");
    return consume(value, serial);
  };

  traps.declare = (kind, identifier, value, serial) => {
    const frames = calls[calls.length-1].frames;
    let frame = frames[frames.length-1];
    if (kind === "var") {
      let index = frames.length;
      while (index-- && frames[index].type !== "closure");
      if (index === -1)
        return consume(value, serial);
      frame = frames[index];
    }
    if (frame.type === "with")
      throw new Error("Illegal with frame.");
    Object_defineProperty(frame.binding, identifier, {
      enumerable: true,
      configurable: kind === "var",
      writable: kind !== "const",
      value: value
    });
    return consume(value, serial);
  };

  traps.with = (value, serial) => {
    enter("with", serial, value);
    return consume(value, serial);
  };

  traps.eval = (value, serial) => {
    consume(value, serial);
    return join(value, aran.node(serial));
  };

  ///////////////
  // Informers //
  ///////////////

  traps.callee = (value, serial) => {
    calls[calls.length] = {
      scope: Reflect_apply(WeakMap_prototype_get, scopes, [value]),
      frames: []
    };
    enter("closure", serial, Object.create(null));
  };

  traps.block = (serial) => {
    enter("block", serial, Object.create(null));
  };

  traps.try = (serial) => {
    enter("try", serial, Object_create(null)).restore = values.length;
  };

  traps.finally = (serial) => {
    enter("finally", serial, Object_create(null));
  };

  traps.label = (boolean, label, serial) => {
    enter("label", serial, Object_create(null)).label = (boolean ? "Break" : "Continue") + (label||"");
  };

  traps.leave = (type, serial) => {
    leave(type, serial);
  };

  traps.begin = (serial) => {
    completions.length++;
    if (aran.node(serial).AranParent)
      return enter(aran.node(serial).AranStrict ? "closure" : "block", serial, Object_create(null));
    calls[calls.length] = {scope:[global],frames:[]};
    enter("block", serial, Object_create(null));
  };

  traps.break = (boolean, label, serial) => {
    label = (boolean ? "Break" : "Continue") + (label||"");
    let node = aran.node(serial);
    const frames = calls[calls.length-1].frames;
    while (frames.length) {
      const frame = frames[frames.length-1];
      frames.length--;
      if (frame.type === "label" && frame.label === label) {
        return;
      }
    }
    throw new Error("["+serial+"] Break failure: "+label+".");
  };

  ///////////////
  // Combiners //
  ///////////////

  traps.invoke = (value1, value2, values, serial) => {
    for (let index = values.length-1; index >= 0; index--)
      consume(values[index], serial);
    consume(value2, serial);
    consume(value1, serial);
    return produce(Reflect_apply(value1[value2], value1, values), serial);
  };

  traps.construct = (value, values, serial) => {
    for (let index = values.length-1; index >= 0; index--)
      consume(values[index], serial);
    consume(value, serial);
    return produce(Reflect_construct(value, values), serial);
  };

  traps.apply = (value, values, serial) => {
    for (let index = values.length-1; index >= 0; index--)
      consume(values[index], serial);
    consume(value, serial);
    return produce(Reflect_apply(value, aran.node(serial).AranStrict ? void 0 : global, values), serial);
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
    let value3 = value1[value2];
    if (Reflect_apply(WeakMap_prototype_has, substitutes, [value3]))
      return produce(Reflect_apply(WeakMap_prototype_get, substitutes, [value3]));
    return produce(value3, serial);
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
    for (let index = values.length-1; index >= 0; index--)
      consume(values[index], serial);
    return produce(values, serial);
  };

  traps.object = (properties, serial) => {
    const result = {};
    for (let index = properties.length-1; index >= 0; index--) {
      consume(properties[index][1], serial);
      consume(properties[index][0], serial);
      result[properties[index][0]] = properties[index][1];
    }
    return produce(result, serial);
  };

  //////////////
  // Terminal //
  ////////////// 

  traps.success = (value, serial) => {
    check("Completion", completions[completions.length-1], value, serial);
    if (aran.node(serial).AranParent) {
      leave(aran.node(serial).AranStrict ? "closure" : "block", serial);
      return produce(value, serial);
    }
    leave("block", serial);
    if (calls[calls.length-1].frames.length)
      throw new Error("["+serial+"] Call stack frames poluted.");
    calls.length--;
    if (completions.length === 1 && calls.length)
      throw new Error("["+serial+"] Call stack poluted.");
    if (completions.length === 1 && values.length)
      throw new Error("["+serial+"] Value stack poluted.");
    return value;
  };

  traps.failure = (error, serial) => {
    if (completions.length === 1) {
      calls.length = 0;
      values.length = 0;
    }
    return error;
  };

  traps.end = (serial) => {
    completions.length--;
  };

  ///////////////
  // Interface //
  ///////////////

  (function () {
    const ReadlineSync = require("readline-sync");
    const Util = require("util");
    const proxies = new WeakMap();
    Reflect_apply(WeakMap_prototype_set, substitutes, [Proxy, function Proxy (target, traps) {
      if (new.target === void 0) // https://github.com/jsdom/webidl2js/issues/78
        throw new TypeError("Constructor Proxy requires 'new'");
      const proxy = new Proxy(target, traps);
      Reflect_apply(WeakMap_prototype_set, proxies, [proxy, {target:target, traps:traps}]);
      return proxy;
    }]);
    const reify = (key, arguments) => {
      const store = [];
      const jsonify = (value) => {
        if (Reflect_apply(WeakMap_prototype_has, naming, [value]))
          return Reflect_apply(WeakMap_prototype_get, naming, [value]);
        if (value === void 0 || value === 1/0 || value === -1/0 || value !== value)
          return [String(value)]
        if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string")
          return value;
        let pointer = 0;
        while (store[pointer] !== value && pointer < store.length)
          pointer++;
        if (pointer === store.length)
          store[pointer] = value;
        return ["pointer", pointer];
      };
      const state = {
        key: key,
        arguments: Reflect_apply(Array_prototype_map, arguments, [jsonify]),
        completions: Reflect_apply(Array_prototype_map, completions, [jsonify]),
        values: Reflect_apply(Array_prototype_map, values, [jsonify]),
        calls: Reflect_apply(Array_prototype_map, calls, [(call) => ({
          scope: Reflect_apply(Array_prototype_map, call.scope, [jsonify]),
          frames: Reflect_apply(Array_prototype_map, call.frames, [(frame) => ({
            type: frame.type,
            serial: frame.serial,
            binding: jsonify(frame.binding),
            label: frame.label,
            restore: frame.restore  
          })])
        })]),
        store: {}
      };
      for (let index = 0; index < store.length; index++) {
        if (typeof store[index] === "symbol") {
          state.store[index] = {
            type: "symbol",
            name: String(store[index])
          };
        } else if (Reflect_apply(WeakMap_prototype_has, proxies, [store[index]])) {
          const inner = Reflect_apply(WeakMap_prototype_get, proxies, [store[index]]);
          state.store[index] = {
            type: "proxy",
            target: jsonify(inner.target),
            traps: jsonify(inner.traps)
          };
        } else {
          state.store[index] = {
            type: Array.isArray(store[index]) ? "array" : typeof store[index],
            prototype: jsonify(Object_getPrototypeOf(store[index])),
            descriptors: Object_getOwnPropertyDescriptors(store[index])
          };
          Reflect_apply(Array_prototype_forEach, Object_values(state.store[index].descriptors), [(descriptor) => {
            if ("value" in descriptor)
              return descriptor.value = jsonify(descriptor.value);
            descriptor.get = jsonify(descriptor.get);
            descriptor.set = jsonify(descriptor.set);
          }]);
          if (Reflect_apply(WeakMap_prototype_has, scopes, [store[index]])) {
            const scope = Reflect_apply(WeakMap_prototype_get, scopes, [store[index]]);
            state.store[index].scope = Reflect_apply(Array_prototype_map, scope, [jsonify]);
          }
        }
      }
      return state;
    };
    // Reflect_apply(Array_prototype_forEach, Object_keys(traps), [(key) => {
    //   const trap = traps[key];
    //   traps[key] = function () {
    //     console.log(Util.inspect(reify(key, arguments), {depth:null, colors:true}));
    //     ReadlineSync.question("Press <enter> to step in...");
    //     return Reflect_apply(trap, this, arguments);
    //   };
    // }]);
  } ());

  return traps;

};