const __ARAN__itr = {
  "__proto__": null,
  "aran.global": globalThis,
  "aran.templates": {
    __proto__: null,
  },
  "aran.record": {
    __proto__: null,
  },
  "aran.unary": (operator, argument) => {
    switch (operator) {
      case "+":
        return +argument;
      case "-":
        return -argument;
      case "~":
        return ~argument;
      case "!":
        return !argument;
      case "typeof":
        return typeof argument;
      case "void":
        return void argument;
      case "delete":
        return true;
    }
  },
  "aran.binary": (operator, left, right) => {
    switch (operator) {
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "<<":
        return left << right;
      case ">>":
        return left >> right;
      case ">>>":
        return left >>> right;
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "|":
        return left | right;
      case "^":
        return left ^ right;
      case "&":
        return left & right;
      case "in":
        return left in right;
      case "instanceof":
        return left instanceof right;
      case "**":
        return left ** right;
    }
  },
  "aran.throw": (error) => {
    throw error;
  },
  "aran.get": (object, key) => object[key],
  "aran.deadzone": globalThis.Symbol("deadzone"),
  "aran.listRest": ((apply) => (iterator, next) => {
    const rest = [];
    let step = apply(next, iterator, []);
    let index = 0;
    while (!step.done) {
      rest[index] = step.value;
      index = index + 1;
      step = apply(next, iterator, []);
    }
    return rest;
  })(globalThis.Reflect.apply),
  "aran.listForInKey": (target) => {
    let length = 0;
    const keys = {
      __proto__: null,
    };
    for (const key in target) keys[length++] = key;
    keys.length = length;
    return keys;
  },
  "aran.toPropertyKey": (
    (listKey) => (key) =>
      listKey({
        __proto__: null,
        [key]: null,
      })[0]
  )(globalThis.Reflect.ownKeys),
  "aran.AsyncGeneratorFunction.prototype.prototype":
    globalThis.Reflect.getPrototypeOf(async function* () {}.prototype),
  "aran.GeneratorFunction.prototype.prototype":
    globalThis.Reflect.getPrototypeOf(function* () {}.prototype),
  "aran.createObject": (
    (defineProperty) =>
    (prototype, ...entries) => {
      const descriptor = {
          __proto__: null,
          value: null,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        object = {
          __proto__: prototype,
        },
        length = entries.length;
      let index = 0;
      while (index < length) {
        descriptor.value = entries[index + 1];
        defineProperty(object, entries[index], descriptor);
        index = index + 2;
      }
      return object;
    }
  )(globalThis.Reflect.defineProperty),
  "Function": globalThis.Function,
  "undefined": globalThis.undefined,
  "globalThis": globalThis.globalThis,
  "Object": globalThis.Object,
  "Object.hasOwn": globalThis.Object.hasOwn,
  "Reflect.defineProperty": globalThis.Reflect.defineProperty,
  "eval": globalThis.eval,
  "Symbol": globalThis.Symbol,
  "Symbol.prototype.description@get":
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Symbol.prototype,
      "description",
    ).get,
  "Symbol.unscopables": globalThis.Symbol.unscopables,
  "Symbol.asyncIterator": globalThis.Symbol.asyncIterator,
  "Symbol.iterator": globalThis.Symbol.iterator,
  "Symbol.toStringTag": globalThis.Symbol.toStringTag,
  "Symbol.isConcatSpreadable": globalThis.Symbol.isConcatSpreadable,
  "Function.prototype": globalThis.Function.prototype,
  "Function.prototype.arguments@get":
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Function.prototype,
      "arguments",
    ).get,
  "Function.prototype.arguments@set":
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Function.prototype,
      "arguments",
    ).set,
  "Array.prototype.values": globalThis.Array.prototype.values,
  "Object.prototype": globalThis.Object.prototype,
  "Number.NEGATIVE_INFINITY": globalThis.Number.NEGATIVE_INFINITY,
  "Number.POSITIVE_INFINITY": globalThis.Number.POSITIVE_INFINITY,
  "String": globalThis.String,
  "Number": globalThis.Number,
  "Array.from": globalThis.Array.from,
  "Array.prototype.flat": globalThis.Array.prototype.flat,
  "String.prototype.concat": globalThis.String.prototype.concat,
  "Object.create": globalThis.Object.create,
  "Array.of": globalThis.Array.of,
  "Proxy": globalThis.Proxy,
  "RegExp": globalThis.RegExp,
  "TypeError": globalThis.TypeError,
  "ReferenceError": globalThis.ReferenceError,
  "SyntaxError": globalThis.SyntaxError,
  "Reflect.get": globalThis.Reflect.get,
  "Reflect.has": globalThis.Reflect.has,
  "Reflect.construct": globalThis.Reflect.construct,
  "Reflect.apply": globalThis.Reflect.apply,
  "Reflect.setProtoypeOf": globalThis.Reflect.setProtoypeOf,
  "Reflect.getPrototypeOf": globalThis.Reflect.getPrototypeOf,
  "Reflect.ownKeys": globalThis.Reflect.ownKeys,
  "Reflect.isExtensible": globalThis.Reflect.isExtensible,
  "Object.keys": globalThis.Object.keys,
  "Array.prototype.concat": globalThis.Array.prototype.concat,
  "Array.prototype.includes": globalThis.Array.prototype.includes,
  "Array.prototype.slice": globalThis.Array.prototype.slice,
  "Reflect.set": globalThis.Reflect.set,
  "Reflect.deleteProperty": globalThis.Reflect.deleteProperty,
  "Reflect.setPrototypeOf": globalThis.Reflect.setPrototypeOf,
  "Reflect.getOwnPropertyDescriptor":
    globalThis.Reflect.getOwnPropertyDescriptor,
  "Reflect.preventExtensions": globalThis.Reflect.preventExtensions,
  "Object.assign": globalThis.Object.assign,
  "Object.freeze": globalThis.Object.freeze,
  "Object.defineProperty": globalThis.Object.defineProperty,
  "Object.setPrototypeOf": globalThis.Object.setPrototypeOf,
  "Object.preventExtensions": globalThis.Object.preventExtensions,
  "Array.prototype.fill": globalThis.Array.prototype.fill,
  "Array.prototype.push": globalThis.Array.prototype.push,
  "WeakMap": globalThis.WeakMap,
  "WeakMap.prototype.get": globalThis.WeakMap.prototype.get,
  "WeakMap.prototype.set": globalThis.WeakMap.prototype.set,
  "WeakMap.prototype.has": globalThis.WeakMap.prototype.has,
  "WeakSet": globalThis.WeakSet,
  "WeakSet.prototype.add": globalThis.WeakSet.prototype.add,
  "WeakSet.prototype.has": globalThis.WeakSet.prototype.has,
  "Map": globalThis.Map,
  "Map.prototype.has": globalThis.Map.prototype.has,
  "Map.prototype.get": globalThis.Map.prototype.get,
  "Map.prototype.set": globalThis.Map.prototype.set,
};
let __ARAN__par_scope_read = ((strict, sloppy) => (mode, variable) => {
  switch (mode) {
    case "strict":
      return strict(variable);
    case "sloppy":
      return sloppy(variable);
  }
  throw new __ARAN__itr["SyntaxError"]("invalid mode: " + mode);
})(
  (variable) => {
    "use strict";
    throw new __ARAN__itr["ReferenceError"]("missing variable: " + variable);
  },
  (variable) => {
    switch (variable) {
      case "console":
        return console;
    }
    throw new __ARAN__itr["ReferenceError"]("missing variable: " + variable);
  },
);
(() => {
  "use strict";
  let __ARAN__var_advice,
    __ARAN__var_original__r_3c = __ARAN__itr["aran.deadzone"],
    __ARAN__var_original__w_5k = __ARAN__itr["aran.deadzone"];
  __ARAN__var_advice = (null, __ARAN__itr["aran.get"])(
    __ARAN__itr["aran.global"],
    "_ARAN_ADVICE_",
  );
  __ARAN__var_original__r_3c = (null, __ARAN__itr["Object.freeze"])(
    (null, __ARAN__itr["Object.defineProperty"])(
      (null, __ARAN__itr["Array.of"])("foo", "bar"),
      "raw",
      (null, __ARAN__itr["aran.createObject"])(
        null,
        "value",
        (null, __ARAN__itr["Object.freeze"])(
          (null, __ARAN__itr["Array.of"])("foo", "bar"),
        ),
        "writable",
        false,
        "enumerable",
        false,
        "configurable",
        false,
      ),
    ),
  );
  return ((__ARAN__var_original__w_5k = function (
    ...__ARAN__par_function_arguments
  ) {
    let __ARAN__par_new_target = new.target;
    let __ARAN__par_this = new.target ? void 0 : this;
    let __ARAN__var_original__r_64s = __ARAN__itr["aran.deadzone"],
      __ARAN__var_original__r_uoc = __ARAN__itr["aran.deadzone"],
      __ARAN__var_original__r_6nak = __ARAN__itr["aran.deadzone"],
      __ARAN__var_original__w_a9n8k = __ARAN__itr["aran.deadzone"],
      __ARAN__var_original__r_1krsk = __ARAN__itr["aran.deadzone"],
      __ARAN__var_original__r_47ea3vg1c = __ARAN__itr["aran.deadzone"],
      __ARAN__var_original_arguments,
      __ARAN__var_original_args = __ARAN__itr["aran.deadzone"];
    __ARAN__par_new_target
      ? (__ARAN__par_this = (null, __ARAN__itr["Object.create"])(
          ((__ARAN__var_original__r_64s = (null, __ARAN__itr["aran.get"])(
            __ARAN__par_new_target,
            "prototype",
          )),
          (
            (null, __ARAN__itr["aran.binary"])(
              "===",
              (null, __ARAN__itr["aran.unary"])(
                "typeof",
                __ARAN__var_original__r_64s,
              ),
              "object",
            )
              ? (null, __ARAN__itr["aran.binary"])(
                  "!==",
                  __ARAN__var_original__r_64s,
                  null,
                )
              : (null, __ARAN__itr["aran.binary"])(
                  "===",
                  (null, __ARAN__itr["aran.unary"])(
                    "typeof",
                    __ARAN__var_original__r_64s,
                  ),
                  "function",
                )
          )
            ? __ARAN__var_original__r_64s
            : __ARAN__itr["Object.prototype"]),
        ))
      : (__ARAN__par_this = (null, __ARAN__itr["aran.binary"])(
          "==",
          __ARAN__par_this,
          null,
        )
          ? __ARAN__itr["globalThis"]
          : (null, __ARAN__itr["Object"])(__ARAN__par_this));
    __ARAN__var_original__r_uoc = (null, __ARAN__itr["Object.create"])(
      __ARAN__itr["Object.prototype"],
    );
    __ARAN__var_original__r_6nak = (null, __ARAN__itr["aran.get"])(
      __ARAN__par_function_arguments,
      "length",
    );
    __ARAN__var_original__w_a9n8k = 0;
    while (
      (null, __ARAN__itr["aran.binary"])(
        "<",
        __ARAN__var_original__w_a9n8k,
        __ARAN__var_original__r_6nak,
      )
    ) {
      (null, __ARAN__itr["Reflect.defineProperty"])(
        __ARAN__var_original__r_uoc,
        __ARAN__var_original__w_a9n8k,
        (null, __ARAN__itr["aran.createObject"])(
          null,
          "value",
          (null, __ARAN__itr["aran.get"])(
            __ARAN__par_function_arguments,
            __ARAN__var_original__w_a9n8k,
          ),
          "writable",
          true,
          "enumerable",
          true,
          "configurable",
          true,
        ),
      );
      __ARAN__var_original__w_a9n8k = (null, __ARAN__itr["aran.binary"])(
        "+",
        __ARAN__var_original__w_a9n8k,
        1,
      );
    }
    (null, __ARAN__itr["Reflect.defineProperty"])(
      __ARAN__var_original__r_uoc,
      "length",
      (null, __ARAN__itr["aran.createObject"])(
        null,
        "value",
        (null, __ARAN__itr["aran.get"])(
          __ARAN__par_function_arguments,
          "length",
        ),
        "writable",
        true,
        "enumerable",
        false,
        "configurable",
        true,
      ),
    );
    (null, __ARAN__itr["Reflect.defineProperty"])(
      __ARAN__var_original__r_uoc,
      "callee",
      (null, __ARAN__itr["aran.createObject"])(
        null,
        "get",
        __ARAN__itr["Function.prototype.arguments@get"],
        "set",
        __ARAN__itr["Function.prototype.arguments@set"],
        "enumerable",
        false,
        "configurable",
        false,
      ),
    );
    (null, __ARAN__itr["Reflect.defineProperty"])(
      __ARAN__var_original__r_uoc,
      __ARAN__itr["Symbol.iterator"],
      (null, __ARAN__itr["aran.createObject"])(
        null,
        "value",
        __ARAN__itr["Array.prototype.values"],
        "writable",
        true,
        "enumerable",
        false,
        "configurable",
        true,
      ),
    );
    (null, __ARAN__itr["Reflect.defineProperty"])(
      __ARAN__var_original__r_uoc,
      __ARAN__itr["Symbol.toStringTag"],
      (null, __ARAN__itr["aran.createObject"])(
        null,
        "value",
        "Arguments",
        "writable",
        true,
        "enumerable",
        false,
        "configurable",
        true,
      ),
    );
    __ARAN__var_original_arguments = __ARAN__var_original__r_uoc;
    __ARAN__var_original__r_1krsk = __ARAN__par_function_arguments;
    __ARAN__var_original_args = __ARAN__var_original__r_1krsk;
    (__ARAN__var_original__r_47ea3vg1c = __ARAN__par_scope_read(
      "sloppy",
      "console",
    )),
      __ARAN__itr["Reflect.apply"](
        (null, __ARAN__itr["aran.get"])(
          __ARAN__var_original__r_47ea3vg1c,
          "log",
        ),
        __ARAN__var_original__r_47ea3vg1c,
        [
          (null, __ARAN__itr["aran.binary"])(
            "===",
            __ARAN__var_original_args,
            __ARAN__itr["aran.deadzone"],
          )
            ? (null, __ARAN__itr["aran.throw"])(
                new __ARAN__itr["ReferenceError"](
                  'Cannot access variable "args" before initialization',
                ),
              )
            : __ARAN__var_original_args,
        ],
      );
    return __ARAN__par_new_target ? __ARAN__par_this : __ARAN__itr["undefined"];
  }),
  (null, __ARAN__itr["Reflect.defineProperty"])(
    __ARAN__var_original__w_5k,
    "length",
    (null, __ARAN__itr["aran.createObject"])(
      null,
      "value",
      0,
      "writable",
      false,
      "enumerable",
      false,
      "configurable",
      true,
    ),
  ),
  (null, __ARAN__itr["Reflect.defineProperty"])(
    __ARAN__var_original__w_5k,
    "name",
    (null, __ARAN__itr["aran.createObject"])(
      null,
      "value",
      "",
      "writable",
      false,
      "enumerable",
      false,
      "configurable",
      true,
    ),
  ),
  (null, __ARAN__itr["Reflect.defineProperty"])(
    __ARAN__var_original__w_5k,
    "arguments",
    (null, __ARAN__itr["aran.createObject"])(
      null,
      "value",
      null,
      "writable",
      false,
      "enumerable",
      false,
      "configurable",
      true,
    ),
  ),
  (null, __ARAN__itr["Reflect.defineProperty"])(
    __ARAN__var_original__w_5k,
    "caller",
    (null, __ARAN__itr["aran.createObject"])(
      null,
      "value",
      null,
      "writable",
      false,
      "enumerable",
      false,
      "configurable",
      true,
    ),
  ),
  (null, __ARAN__itr["Reflect.defineProperty"])(
    __ARAN__var_original__w_5k,
    "prototype",
    (null, __ARAN__itr["aran.createObject"])(
      null,
      "value",
      (null, __ARAN__itr["Object.defineProperty"])(
        (null, __ARAN__itr["Object.create"])(__ARAN__itr["Object.prototype"]),
        "constructor",
        (null, __ARAN__itr["aran.createObject"])(
          null,
          "value",
          __ARAN__var_original__w_5k,
          "writable",
          true,
          "enumerable",
          false,
          "configurable",
          true,
        ),
      ),
      "writable",
      false,
      "enumerable",
      false,
      "configurable",
      true,
    ),
  ),
  __ARAN__var_original__w_5k)(__ARAN__var_original__r_3c, 123);
})();
