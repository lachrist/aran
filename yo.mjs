globalThis._ARAN_INTRINSIC_ = {
  __proto__: null,
  ["aran.global_object"]: globalThis,
  ["aran.global_declarative_record"]: {
    __proto__: null,
  },
  ["aran.transpileEvalCode"]: (({ SyntaxError: SyntaxError }) =>
    ({
      transpileEvalCode: (code, situ) => {
        throw new SyntaxError(
          "aran.transpileEvalCode must be overriden to support direct eval calls",
        );
      },
    }).transpileEvalCode)(globalThis),
  ["aran.retropileEvalCode"]: (({ SyntaxError: SyntaxError }) =>
    ({
      retropileEvalCode: (aran) => {
        throw new SyntaxError(
          "aran.retropileEvalCode must be overriden to support direct eval calls",
        );
      },
    }).retropileEvalCode)(globalThis),
  ["aran.performUnaryOperation"]: {
    performUnaryOperation: (operator, argument) => {
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
  }.performUnaryOperation,
  ["aran.performBinaryOperation"]: {
    performBinaryOperation: (operator, left, right) => {
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
  }.performBinaryOperation,
  ["aran.throwException"]: {
    throwException: (error) => {
      throw error;
    },
  }.throwException,
  ["aran.getValueProperty"]: {
    getValueProperty: (object, key) => object[key],
  }.getValueProperty,
  ["aran.deadzone_symbol"]: globalThis.Symbol("deadzone"),
  ["aran.listIteratorRest"]: ((apply) =>
    ({
      listIteratorRest: (iterator, next) => {
        const rest = [];
        let step = apply(next, iterator, []);
        let index = 0;
        while (!step.done) {
          rest[index] = step.value;
          index = index + 1;
          step = apply(next, iterator, []);
        }
        return rest;
      },
    }).listIteratorRest)(globalThis.Reflect.apply),
  ["aran.listForInKey"]: {
    listForInKey: (target) => {
      let length = 0;
      const keys = {
        __proto__: null,
      };
      for (const key in target) keys[length++] = key;
      keys.length = length;
      return keys;
    },
  }.listForInKey,
  ["aran.toPropertyKey"]: ((listKey) =>
    ({
      toPropertyKey: (key) =>
        listKey({
          __proto__: null,
          [key]: null,
        })[0],
    }).toPropertyKey)(globalThis.Reflect.ownKeys),
  ["aran.sliceObject"]: ((
    {
      Object: { hasOwn: hasOwn },
      Reflect: {
        getOwnPropertyDescriptor: getOwnPropertyDescriptor,
        defineProperty: defineProperty,
        ownKeys: ownKeys,
      },
    },
    descriptor,
  ) =>
    ({
      sliceObject: (object, exclusion) => {
        const keys = ownKeys(object);
        const length = keys.length;
        const copy = {};
        let index = 0;
        while (index < length) {
          const key = keys[index];
          if (
            !hasOwn(exclusion, key) &&
            (
              getOwnPropertyDescriptor(object, key) ?? {
                enumerable: false,
              }
            ).enumerable
          ) {
            defineProperty(
              copy,
              key,
              ((descriptor.value = object[key]), descriptor),
            );
          }
          index = index + 1;
        }
        descriptor.value = null;
        return copy;
      },
    }).sliceObject)(globalThis, {
    __proto__: null,
    value: null,
    writable: true,
    enumerable: true,
    configurable: true,
  }),
  ["aran.isConstructor"]: {
    isConstructor:
      ({ Reflect: { construct: construct }, Boolean: Boolean }, empty) =>
      (value) => {
        try {
          construct(Boolean, empty, value);
          return true;
        } catch {
          return false;
        }
      },
  }.isConstructor(globalThis, []),
  ["aran.toArgumentList"]: ((
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
    ({
      toArgumentList: (array, callee) => {
        const list = {};
        const length = array.length;
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
        defineProperty(
          list,
          "length",
          ((descriptor.value = length), descriptor),
        );
        defineProperty(
          list,
          "callee",
          callee
            ? ((descriptor.value = callee), descriptor)
            : default_callee_descriptor,
        );
        defineProperty(
          list,
          iterator,
          ((descriptor.value = values), descriptor),
        );
        defineProperty(
          list,
          toStringTag,
          ((descriptor.value = "Arguments"), descriptor),
        );
        descriptor.enumerable = true;
        return list;
      },
    }).toArgumentList)(
    {
      __proto__: null,
      value: null,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    {
      __proto__: null,
      ...globalThis.Reflect.getOwnPropertyDescriptor(
        globalThis.Function.prototype,
        "arguments",
      ),
      configurable: false,
    },
    globalThis,
  ),
  ["aran.AsyncGeneratorFunction.prototype.prototype"]:
    globalThis.Reflect.getPrototypeOf(async function* () {}.prototype),
  ["aran.GeneratorFunction.prototype.prototype"]:
    globalThis.Reflect.getPrototypeOf(function* () {}.prototype),
  ["aran.declareGlobalVariable"]: (({ eval: global_eval }) =>
    ({
      declareGlobalVariable: (variables) =>
        global_eval("var " + variables + ";"),
    }).declareGlobalVariable)(globalThis),
  ["aran.createObject"]: (
    (defineProperty) =>
    (prototype, ...entries) => {
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
        defineProperty(object, entries[index], descriptor);
        index = index + 2;
      }
      return object;
    }
  )(globalThis.Reflect.defineProperty),
  ["aran.readGlobalVariable"]: (({ eval: global_eval }, cache) =>
    ({
      readGlobalVariable: (variable, additional, optimization) =>
        optimization
          ? (cache[variable] = optimization)
          : (
              cache[variable] ??
              (cache[variable] = global_eval("(() => " + variable + ");"))
            )(additional),
    }).readGlobalVariable)(globalThis, {
    __proto__: null,
  }),
  ["aran.writeGlobalVariableStrict"]: (({ eval: global_eval }, cache) =>
    ({
      writeGlobalVariableStrict: (variable, additional, optimization) =>
        optimization
          ? (cache[variable] = optimization)
          : (
              cache[variable] ??
              (cache[variable] = global_eval(
                "'use strict'; ((" +
                  (variable === "VALUE" ? "$VALUE) => { " : "VALUE) => { ") +
                  variable +
                  " = " +
                  (variable === "VALUE" ? "$VALUE; });" : "VALUE; });"),
              ))
            )(additional),
    }).writeGlobalVariableStrict)(globalThis, {
    __proto__: null,
  }),
  ["aran.writeGlobalVariableSloppy"]: (({ eval: global_eval }, cache) =>
    ({
      writeGlobalVariableSloppy: (variable, additional, optimization) =>
        optimization
          ? (cache[variable] = optimization)
          : (
              cache[variable] ??
              (cache[variable] = global_eval(
                "((" +
                  (variable === "VALUE" ? "$VALUE) => { " : "VALUE) => { ") +
                  variable +
                  " = " +
                  (variable === "VALUE" ? "$VALUE; });" : "VALUE; });"),
              ))
            )(additional),
    }).writeGlobalVariableSloppy)(globalThis, {
    __proto__: null,
  }),
  ["aran.typeofGlobalVariable"]: (({ eval: global_eval }, cache) =>
    ({
      typeofGlobalVariable: (variable, additional, optimization) =>
        optimization
          ? (cache[variable] = optimization)
          : (
              cache[variable] ??
              (cache[variable] = global_eval(
                "(() => typeof " + variable + ");",
              ))
            )(additional),
    }).typeofGlobalVariable)(globalThis, {
    __proto__: null,
  }),
  ["aran.discardGlobalVariable"]: (({ eval: global_eval }, cache) =>
    ({
      discardGlobalVariable: (variable, additional, optimization) =>
        optimization
          ? (cache[variable] = optimization)
          : (
              cache[variable] ??
              (cache[variable] = global_eval(
                "(() => delete " + variable + ");",
              ))
            )(additional),
    }).discardGlobalVariable)(globalThis, {
    __proto__: null,
  }),
  ["Function"]: globalThis.Function,
  ["undefined"]: globalThis.undefined,
  ["globalThis"]: globalThis.globalThis,
  ["Object"]: globalThis.Object,
  ["Object.hasOwn"]: globalThis.Object.hasOwn,
  ["Reflect.defineProperty"]: globalThis.Reflect.defineProperty,
  ["eval"]: globalThis.eval,
  ["Symbol"]: globalThis.Symbol,
  ["Symbol.prototype.description@get"]:
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Symbol.prototype,
      "description",
    ).get,
  ["Symbol.unscopables"]: globalThis.Symbol.unscopables,
  ["Symbol.asyncIterator"]: globalThis.Symbol.asyncIterator,
  ["Symbol.iterator"]: globalThis.Symbol.iterator,
  ["Symbol.toStringTag"]: globalThis.Symbol.toStringTag,
  ["Symbol.isConcatSpreadable"]: globalThis.Symbol.isConcatSpreadable,
  ["Function.prototype"]: globalThis.Function.prototype,
  ["Function.prototype.arguments@get"]:
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Function.prototype,
      "arguments",
    ).get,
  ["Function.prototype.arguments@set"]:
    globalThis.Reflect.getOwnPropertyDescriptor(
      globalThis.Function.prototype,
      "arguments",
    ).set,
  ["Array.prototype.values"]: globalThis.Array.prototype.values,
  ["Object.prototype"]: globalThis.Object.prototype,
  ["Number.NEGATIVE_INFINITY"]: globalThis.Number.NEGATIVE_INFINITY,
  ["Number.POSITIVE_INFINITY"]: globalThis.Number.POSITIVE_INFINITY,
  ["String"]: globalThis.String,
  ["Number"]: globalThis.Number,
  ["Array.from"]: globalThis.Array.from,
  ["Array.prototype.flat"]: globalThis.Array.prototype.flat,
  ["String.prototype.concat"]: globalThis.String.prototype.concat,
  ["Object.create"]: globalThis.Object.create,
  ["Array.of"]: globalThis.Array.of,
  ["Proxy"]: globalThis.Proxy,
  ["RegExp"]: globalThis.RegExp,
  ["TypeError"]: globalThis.TypeError,
  ["ReferenceError"]: globalThis.ReferenceError,
  ["SyntaxError"]: globalThis.SyntaxError,
  ["Reflect.get"]: globalThis.Reflect.get,
  ["Reflect.has"]: globalThis.Reflect.has,
  ["Reflect.construct"]: globalThis.Reflect.construct,
  ["Reflect.apply"]: globalThis.Reflect.apply,
  ["Reflect.setProtoypeOf"]: globalThis.Reflect.setProtoypeOf,
  ["Reflect.getPrototypeOf"]: globalThis.Reflect.getPrototypeOf,
  ["Reflect.ownKeys"]: globalThis.Reflect.ownKeys,
  ["Reflect.isExtensible"]: globalThis.Reflect.isExtensible,
  ["Object.keys"]: globalThis.Object.keys,
  ["Array.prototype.concat"]: globalThis.Array.prototype.concat,
  ["Array.prototype.includes"]: globalThis.Array.prototype.includes,
  ["Array.prototype.slice"]: globalThis.Array.prototype.slice,
  ["Reflect.set"]: globalThis.Reflect.set,
  ["Reflect.deleteProperty"]: globalThis.Reflect.deleteProperty,
  ["Reflect.setPrototypeOf"]: globalThis.Reflect.setPrototypeOf,
  ["Reflect.getOwnPropertyDescriptor"]:
    globalThis.Reflect.getOwnPropertyDescriptor,
  ["Reflect.preventExtensions"]: globalThis.Reflect.preventExtensions,
  ["Object.assign"]: globalThis.Object.assign,
  ["Object.freeze"]: globalThis.Object.freeze,
  ["Object.defineProperty"]: globalThis.Object.defineProperty,
  ["Object.setPrototypeOf"]: globalThis.Object.setPrototypeOf,
  ["Object.preventExtensions"]: globalThis.Object.preventExtensions,
  ["Array.prototype.fill"]: globalThis.Array.prototype.fill,
  ["Array.prototype.push"]: globalThis.Array.prototype.push,
  ["WeakMap"]: globalThis.WeakMap,
  ["WeakMap.prototype.get"]: globalThis.WeakMap.prototype.get,
  ["WeakMap.prototype.set"]: globalThis.WeakMap.prototype.set,
  ["WeakMap.prototype.has"]: globalThis.WeakMap.prototype.has,
  ["WeakSet"]: globalThis.WeakSet,
  ["WeakSet.prototype.add"]: globalThis.WeakSet.prototype.add,
  ["WeakSet.prototype.has"]: globalThis.WeakSet.prototype.has,
  ["Map"]: globalThis.Map,
  ["Map.prototype.has"]: globalThis.Map.prototype.has,
  ["Map.prototype.get"]: globalThis.Map.prototype.get,
  ["Map.prototype.set"]: globalThis.Map.prototype.set,
};
