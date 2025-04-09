// @ts-nocheck
/* eslint-disable */
/** @type {(global: typeof globalThis) => import('../lang/syntax').IntrinsicRecord} */
export const compileIntrinsicRecord = (global) => {
  const $SyntaxError = global["SyntaxError"];
  const $Symbol = global["Symbol"];
  const $Reflect_apply = global["Reflect"]["apply"];
  const $Reflect_ownKeys = global["Reflect"]["ownKeys"];
  const $Object_hasOwn = global["Object"]["hasOwn"];
  const $Reflect_getOwnPropertyDescriptor =
    global["Reflect"]["getOwnPropertyDescriptor"];
  const $Reflect_defineProperty = global["Reflect"]["defineProperty"];
  const $Boolean = global["Boolean"];
  const $Reflect_construct = global["Reflect"]["construct"];
  const $Array_prototype_values = global["Array"]["prototype"]["values"];
  const $Function_prototype = global["Function"]["prototype"];
  const $Symbol_iterator = global["Symbol"]["iterator"];
  const $Symbol_toStringTag = global["Symbol"]["toStringTag"];
  const $Reflect_getPrototypeOf = global["Reflect"]["getPrototypeOf"];
  const $eval = global["eval"];
  const transpileEvalCode = (_code, _situ) => {
    throw new $SyntaxError(
      "aran.transpileEvalCode must be overriden to support direct eval calls",
    );
  };
  const retropileEvalCode = (_aran) => {
    throw new $SyntaxError(
      "aran.retropileEvalCode must be overriden to support direct eval calls",
    );
  };
  const performUnaryOperation = (operator, argument) => {
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
  };
  const performBinaryOperation = (operator, left, right) => {
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
  };
  const throwException = (error) => {
    throw error;
  };
  const getValueProperty = (object, key) => object[key];
  const listIteratorRest = (iterator, next) => {
    const rest = [];
    let step = $Reflect_apply(next, iterator, []);
    let index = 0;
    while (!step.done) {
      rest[index] = step.value;
      index = index + 1;
      step = $Reflect_apply(next, iterator, []);
    }
    return rest;
  };
  const listForInKey = (target) => {
    let length = 0;
    const keys = {
      __proto__: null,
    };
    for (const key in target) keys[length++] = key;
    keys.length = length;
    return keys;
  };
  const toPropertyKey = (key) =>
    $Reflect_ownKeys({
      __proto__: null,
      [key]: null,
    })[0];
  const sliceObject = (object, exclusion) => {
    const descriptor = {
      __proto__: null,
      value: null,
      writable: true,
      enumerable: true,
      configurable: true,
    };
    const keys = $Reflect_ownKeys(object);
    const length = keys.length;
    const copy = {};
    let index = 0;
    while (index < length) {
      const key = keys[index];
      if (
        !$Object_hasOwn(exclusion, key) &&
        (
          $Reflect_getOwnPropertyDescriptor(object, key) ?? {
            enumerable: false,
          }
        ).enumerable
      ) {
        $Reflect_defineProperty(
          copy,
          key,
          ((descriptor.value = object[key]), descriptor),
        );
      }
      index = index + 1;
    }
    return copy;
  };
  const isConstructor = (value) => {
    try {
      $Reflect_construct($Boolean, {}, value);
      return true;
    } catch {
      return false;
    }
  };
  const default_callee_descriptor = {
    __proto__: null,
    ...$Reflect_getOwnPropertyDescriptor($Function_prototype, "arguments"),
    configurable: false,
  };
  const toArgumentList = (array, callee) => {
    const descriptor = {
      __proto__: null,
      value: null,
      writable: true,
      enumerable: true,
      configurable: true,
    };
    const list = {};
    const length = array.length;
    let index = 0;
    while (index < length) {
      $Reflect_defineProperty(
        list,
        index,
        ((descriptor.value = array[index]), descriptor),
      );
      index = index + 1;
    }
    descriptor.enumerable = false;
    $Reflect_defineProperty(
      list,
      "length",
      ((descriptor.value = length), descriptor),
    );
    $Reflect_defineProperty(
      list,
      "callee",
      callee
        ? ((descriptor.value = callee), descriptor)
        : default_callee_descriptor,
    );
    $Reflect_defineProperty(
      list,
      $Symbol_iterator,
      ((descriptor.value = $Array_prototype_values), descriptor),
    );
    $Reflect_defineProperty(
      list,
      $Symbol_toStringTag,
      ((descriptor.value = "Arguments"), descriptor),
    );
    return list;
  };
  const declareGlobalVariable = (variables) => $eval("var " + variables + ";");
  const createObject = (prototype, ...entries) => {
    const descriptor = {
      __proto__: null,
      value: null,
      writable: true,
      enumerable: true,
      configurable: true,
    };
    const object = {
      __proto__: prototype,
    };
    const length = entries.length;
    let index = 0;
    while (index < length) {
      descriptor.value = entries[index + 1];
      $Reflect_defineProperty(object, entries[index], descriptor);
      index = index + 2;
    }
    return object;
  };
  const readGlobalVariable_cache = {
    __proto__: null,
  };
  const readGlobalVariable = (variable, additional, optimization) =>
    optimization
      ? (readGlobalVariable_cache[variable] = optimization)
      : (
          readGlobalVariable_cache[variable] ??
          (readGlobalVariable_cache[variable] = $eval(
            "(() => " + variable + ");",
          ))
        )(additional);
  const writeGlobalVariableStrict_cache = {
    __proto__: null,
  };
  const writeGlobalVariableStrict = (variable, additional, optimization) =>
    optimization
      ? (writeGlobalVariableStrict_cache[variable] = optimization)
      : (
          writeGlobalVariableStrict_cache[variable] ??
          (writeGlobalVariableStrict_cache[variable] = $eval(
            "'use strict'; ((" +
              (variable === "VALUE" ? "$VALUE) => { " : "VALUE) => { ") +
              variable +
              " = " +
              (variable === "VALUE" ? "$VALUE; });" : "VALUE; });"),
          ))
        )(additional);
  const writeGlobalVariableSloppy_cache = {
    __proto__: null,
  };
  const writeGlobalVariableSloppy = (variable, additional, optimization) =>
    optimization
      ? (writeGlobalVariableSloppy_cache[variable] = optimization)
      : (
          writeGlobalVariableSloppy_cache[variable] ??
          (writeGlobalVariableSloppy_cache[variable] = $eval(
            "((" +
              (variable === "VALUE" ? "$VALUE) => { " : "VALUE) => { ") +
              variable +
              " = " +
              (variable === "VALUE" ? "$VALUE; });" : "VALUE; });"),
          ))
        )(additional);
  const typeofGlobalVariable_cache = {
    __proto__: null,
  };
  const typeofGlobalVariable = (variable, additional, optimization) =>
    optimization
      ? (typeofGlobalVariable_cache[variable] = optimization)
      : (
          typeofGlobalVariable_cache[variable] ??
          (typeofGlobalVariable_cache[variable] = $eval(
            "(() => typeof " + variable + ");",
          ))
        )(additional);
  const discardGlobalVariable_cache = {
    __proto__: null,
  };
  const discardGlobalVariable = (variable, additional, optimization) =>
    optimization
      ? (discardGlobalVariable_cache[variable] = optimization)
      : (
          discardGlobalVariable_cache[variable] ??
          (discardGlobalVariable_cache[variable] = $eval(
            "(() => delete " + variable + ");",
          ))
        )(additional);
  return {
    ["aran.global_object"]: global,
    ["aran.global_declarative_record"]: {
      __proto__: null,
    },
    ["aran.transpileEvalCode"]: transpileEvalCode,
    ["aran.retropileEvalCode"]: retropileEvalCode,
    ["aran.performUnaryOperation"]: performUnaryOperation,
    ["aran.performBinaryOperation"]: performBinaryOperation,
    ["aran.throwException"]: throwException,
    ["aran.getValueProperty"]: getValueProperty,
    ["aran.deadzone_symbol"]: $Symbol("deadzone"),
    ["aran.listIteratorRest"]: listIteratorRest,
    ["aran.listForInKey"]: listForInKey,
    ["aran.toPropertyKey"]: toPropertyKey,
    ["aran.sliceObject"]: sliceObject,
    ["aran.isConstructor"]: isConstructor,
    ["aran.toArgumentList"]: toArgumentList,
    ["aran.AsyncGeneratorFunction.prototype.prototype"]:
      $Reflect_getPrototypeOf(async function* () {}.prototype),
    ["aran.GeneratorFunction.prototype.prototype"]: $Reflect_getPrototypeOf(
      function* () {}.prototype,
    ),
    ["aran.declareGlobalVariable"]: declareGlobalVariable,
    ["aran.createObject"]: createObject,
    ["aran.readGlobalVariable"]: readGlobalVariable,
    ["aran.writeGlobalVariableStrict"]: writeGlobalVariableStrict,
    ["aran.writeGlobalVariableSloppy"]: writeGlobalVariableSloppy,
    ["aran.typeofGlobalVariable"]: typeofGlobalVariable,
    ["aran.discardGlobalVariable"]: discardGlobalVariable,
    ["Function"]: global.Function,
    ["undefined"]: global.undefined,
    ["globalThis"]: global.globalThis,
    ["Object"]: global.Object,
    ["Object.hasOwn"]: global.Object.hasOwn,
    ["Reflect.defineProperty"]: global.Reflect.defineProperty,
    ["eval"]: global.eval,
    ["Symbol"]: global.Symbol,
    ["Symbol.prototype.description@get"]: $Reflect_getOwnPropertyDescriptor(
      global.Symbol.prototype,
      "description",
    ).get,
    ["Symbol.unscopables"]: global.Symbol.unscopables,
    ["Symbol.asyncIterator"]: global.Symbol.asyncIterator,
    ["Symbol.iterator"]: global.Symbol.iterator,
    ["Symbol.toStringTag"]: global.Symbol.toStringTag,
    ["Symbol.isConcatSpreadable"]: global.Symbol.isConcatSpreadable,
    ["Function.prototype"]: global.Function.prototype,
    ["Function.prototype.arguments@get"]: $Reflect_getOwnPropertyDescriptor(
      global.Function.prototype,
      "arguments",
    ).get,
    ["Function.prototype.arguments@set"]: $Reflect_getOwnPropertyDescriptor(
      global.Function.prototype,
      "arguments",
    ).set,
    ["Array.prototype.values"]: global.Array.prototype.values,
    ["Object.prototype"]: global.Object.prototype,
    ["Number.NEGATIVE_INFINITY"]: global.Number.NEGATIVE_INFINITY,
    ["Number.POSITIVE_INFINITY"]: global.Number.POSITIVE_INFINITY,
    ["String"]: global.String,
    ["Number"]: global.Number,
    ["Array.from"]: global.Array.from,
    ["Array.prototype.flat"]: global.Array.prototype.flat,
    ["String.prototype.concat"]: global.String.prototype.concat,
    ["Object.create"]: global.Object.create,
    ["Array.of"]: global.Array.of,
    ["Proxy"]: global.Proxy,
    ["RegExp"]: global.RegExp,
    ["TypeError"]: global.TypeError,
    ["ReferenceError"]: global.ReferenceError,
    ["SyntaxError"]: global.SyntaxError,
    ["Reflect.get"]: global.Reflect.get,
    ["Reflect.has"]: global.Reflect.has,
    ["Reflect.construct"]: global.Reflect.construct,
    ["Reflect.apply"]: global.Reflect.apply,
    ["Reflect.getPrototypeOf"]: global.Reflect.getPrototypeOf,
    ["Reflect.ownKeys"]: global.Reflect.ownKeys,
    ["Reflect.isExtensible"]: global.Reflect.isExtensible,
    ["Object.keys"]: global.Object.keys,
    ["Array.prototype.concat"]: global.Array.prototype.concat,
    ["Array.prototype.includes"]: global.Array.prototype.includes,
    ["Array.prototype.slice"]: global.Array.prototype.slice,
    ["Reflect.set"]: global.Reflect.set,
    ["Reflect.deleteProperty"]: global.Reflect.deleteProperty,
    ["Reflect.setPrototypeOf"]: global.Reflect.setPrototypeOf,
    ["Reflect.getOwnPropertyDescriptor"]:
      global.Reflect.getOwnPropertyDescriptor,
    ["Reflect.preventExtensions"]: global.Reflect.preventExtensions,
    ["Object.assign"]: global.Object.assign,
    ["Object.freeze"]: global.Object.freeze,
    ["Object.defineProperty"]: global.Object.defineProperty,
    ["Object.setPrototypeOf"]: global.Object.setPrototypeOf,
    ["Object.preventExtensions"]: global.Object.preventExtensions,
    ["Array.prototype.fill"]: global.Array.prototype.fill,
    ["Array.prototype.push"]: global.Array.prototype.push,
    ["WeakMap"]: global.WeakMap,
    ["WeakMap.prototype.get"]: global.WeakMap.prototype.get,
    ["WeakMap.prototype.set"]: global.WeakMap.prototype.set,
    ["WeakMap.prototype.has"]: global.WeakMap.prototype.has,
    ["WeakSet"]: global.WeakSet,
    ["WeakSet.prototype.add"]: global.WeakSet.prototype.add,
    ["WeakSet.prototype.has"]: global.WeakSet.prototype.has,
    ["Map"]: global.Map,
    ["Map.prototype.has"]: global.Map.prototype.has,
    ["Map.prototype.get"]: global.Map.prototype.get,
    ["Map.prototype.set"]: global.Map.prototype.set,
  };
};
