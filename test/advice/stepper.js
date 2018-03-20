
const ReadlineSync = require("readline-sync");
const Util = require("util");
const Shadow = require("./shadow.js");

const Reflect_apply = global.Reflect.apply;
const Object_keys = global.Object.keys;
const Object_getOwnPropertyDescriptor = global.Object.getOwnPropertyDescriptor;
const Object_getOwnPropertyNames = global.Object.getOwnPropertyNames;
const Object_getOwnPropertySymbols = global.Object.getOwnPropertySymbols;
const Object_getPrototypeOf = global.Object.getPrototypeOf;
const Array_isArray = global.Array.isArray;
const Array_prototype_forEach = global.Array.prototype.forEach;
const Array_prototype_map = global.Array.prototype.map;
const JSON_stringify = global.JSON.stringify;

const naming = [
  "global",
  "Object.prototype",
  "Array.prototype",
  "Function.prototype",
  "String.prototype",
  "Boolean.prototype",
  "Error.prototype"
].map((name) => [eval(name), name]);

module.exports = (aran, join) => {

  const shadow = Shadow(aran, join);
  const traps = {};

  const describe = (jsonify, object, key) => {
    const descriptor = Object_getOwnPropertyDescriptor(object, key);
    if ("value" in descriptor) {
      descriptor.value = jsonify(descriptor.value);
    } else {
      descriptor.get = jsonify(descriptor.get);
      descriptor.set = jsonify(descriptor.set);
    }
    return descriptor;
  }

  const reify = (key, arguments) => {
    const store = [];
    const jsonify = (value) => {
      for (let index = 0, length = naming.length; index < length; index++)
        if (naming[index][0] === value)
          return "@"+naming[index][1];
      if (value === void 0 || value === 1/0 || value === -1/0 || value !== value)
        return "#"+String(value)
      if (value === null || typeof value === "boolean" || typeof value === "number")
        return value;
      if (typeof value === "string")
        return value[0] === "$" || value[0] === "@" || value[0] === "&" || value[0] === "#" ? "$"+value : value;
      let pointer = 0;
      while (store[pointer] !== value && pointer < store.length)
        pointer++;
      if (pointer === store.length)
        store[pointer] = value;
      return "&"+pointer;
    };
    const state = {
      key: key,
      serial: arguments[arguments.length-1],
      arguments: [],
      estack: shadow.estack.map(jsonify),
      vstack: shadow.vstack.map(jsonify),
      cstack: shadow.cstack.map((call) => call.reify(jsonify)),
      store: {}
    };
    if (key === "object") {
      arguments[0].map = Array_prototype_map;
      state.arguments.push(arguments[0].map((p) => [jsonify(p[0]), jsonify(p[1])]));
    } else {
      for (var index=0, last=arguments.length-1; index<last; index++) {
        if ((key === "apply" && index === 2) || (key === "construct" && index === 1) || (key === "invoke" && index === 2)) {
          arguments[index].map = Array_prototype_map;
          state.arguments.push(arguments[index].map(jsonify));
        } else {
          state.arguments.push(jsonify(arguments[index]));
        }
      }
    }
    for (let index = 0; index < store.length; index++) {
      if (typeof store[index] === "symbol") {
        state.store["&"+index] = {
          type: "symbol",
          name: String(store[index])
        };
      } else if (shadow.proxies.has(store[index])) {
        const parts = shadow.proxies.get(store[index]);
        state.store["&"+index] = {
          type: "proxy",
          target: jsonify(parts.target),
          traps: jsonify(parts.traps)
        };
      } else {
        state.store["&"+index] = {
          type: Array_isArray(store[index]) ? "array" : typeof store[index],
          prototype: jsonify(Object_getPrototypeOf(store[index])),
          names: {},
        };
        Reflect_apply(Array_prototype_forEach, Object_getOwnPropertyNames(store[index]), [(name) => {
          state.store["&"+index].names[name] = describe(jsonify, store[index], name);
        }]);
        const symbols = Object_getOwnPropertySymbols(store[index]);
        symbols.map = Array_prototype_map;
        state.store["&"+index].symbols = symbols.map((symbol) => {
          const descriptor = describe(jsonify, store[index], symbol);
          descriptor.key = jsonify(symbol);
          return descriptor;
        });
        if (shadow.scopes.has(store[index])) {
          state.store["&"+index].scope = shadow.scopes.get(store[index]).reify(jsonify);
        }
      }
    }
    return state;
  };

  Reflect_apply(Array_prototype_forEach, Object_keys(shadow.traps), [(key) => {
    traps[key] = function () {
      console.log(Util.inspect(reify(key, arguments), {colors:true,depth:null}));
      ReadlineSync.question("Press <enter> to step in...");
      return Reflect_apply(shadow.traps[key], this, arguments);
    };
  }]);

  return {traps:traps};

};
