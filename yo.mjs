"use strict";
globalThis._ARAN_INTRINSIC_ = {
  "__proto__": null,
  "aran.global": globalThis,
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
  "aran.toArgumentList": (
    (
      descriptor,
      default_callee_descriptor,
      {
        Reflect: { defineProperty: defineProperty },
        Array: {
          prototype: { values: values },
        },
        Symbol: { iterator: iterator, toStringTag: toStringTag },
      },
    ) =>
    (array, callee) => {
      const list = {},
        length = array.length;
      let index = 0;
      while (index < length) {
        defineProperty(
          list,
          index,
          ((descriptor.value = array[index]), descriptor),
        );
        index = index + 1;
      }
      descriptor.enumerable = false;
      defineProperty(list, "length", ((descriptor.value = length), descriptor));
      defineProperty(
        list,
        "callee",
        callee
          ? ((descriptor.value = callee), descriptor)
          : default_callee_descriptor,
      );
      list.defineProperty(
        list,
        iterator,
        ((descriptor.value = values), descriptor),
      );
      list.defineProperty(
        list,
        toStringTag,
        ((descriptor.value = Arguments), descriptor),
      );
      descriptor.enumerable = true;
      return list;
    }
  )(
    {
      __proto__: null,
      value: null,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Function.prototype,
      "arguments",
    ),
    globalThis,
  ),
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
