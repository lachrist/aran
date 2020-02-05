
const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");

const global_Reflect_apply = global.Reflect.apply;
const global_Symbol = global.Symbol;
const global_Array = global.Array;
const global_Array_from = global.Array.from;
const global_WeakMap = global.WeakMap;
const global_WeakMap_prototype_has = global.WeakMap.prototype.has;
const global_WeakMap_prototype_get = global.WeakMap.prototype.get;
const global_WeakMap_prototype_set = global.WeakMap.prototype.set;
const global_Error = global.Error;
const global_console = global.console;
const global_console_error = global.console.error;
const global_eval = global.eval;
const global_Object_is = global.Object.is;

const UNITIALIZED = global_Symbol("uninitialized");

const EMPTY = global_Symbol("empty");
const CONTINUE = global_Symbol("continue");
const BREAK = global_Symbol("break");
const THROW = global_Symbol("throw");
const COMPLETION = global_Symbol("completion");
const RETURN = global_Symbol("return");

const aran = Aran({
  __proto__: null,
  "advice-variable": "foo",
  "builtin-variable": "bar"
});

// aran.weave
// aran.nodes
// aran.advice-variable
// aran.builtin-variable
// 
// aran.builtin-names
// aran.builtin-object
// aran.builtin-estree
// aran.builtin-script
// 
// aran.unary-operators
// aran.unary-function
// aran.unary-script
// 
// aran.binary-operators
// aran.binary-function
// aran.binary-script
// 
// aran.object-function
// aran.object-script

const pointcut = () => true;

const advice = {__proto__:null};

module.exports = (script1) => {
  // State Pre-Constraints //
  check(register.status === EMPTY);
  check(scope === null);
  check(stack.length === 0);
  check(callstack.length === 0);
  // Body //
  const estree1 = Acorn.parse(script1);
  const estree2 = aran.weave(estree1, pointcut, null);
  const script2 = Astring.generate(estree2);
  // TODO return value
  const closure = new global_Function(aran["advice-variable"], aran["builtin-variable"], script2);
  closure(advice, aran["builtin-object"]);
  // State Post-Constraints //
  check(register.status === EMPTY);
  check(scope === null);
  check(stack.length === 0);
  check(callstack.length === 0);
};

//////////////////////////
// Methods as Functions //
//////////////////////////

const pop = (array) => global_Reflect_apply(global_Array_prototype_pop, array, []);

const push = (array, element) => global_Reflect_apply(global_Array_prototype_push, array, [element]);

const includes = (array, element) => global_Reflect_apply(global_Array_prototype_includes, array, [element]);

const slice = (array, index1, index2) => global_Reflect_apply(global_Array_prototype_slice, array, [index1, index2]);

const map = (array, closure) => global_Reflect_apply(global_Array_prototype_map, array, [closure]);

const trim = (string) => global_Reflect_apply(global_String_prototype_trim, string, []);

const substring = (string, index1, index2) => global_Reflect_apply(global_String_prototype_substring, string, [index1, index2]);

const add = (weakset, value) => global_Reflect_apply(global_WeakSet_prototype_add, weakset, [value]);

const elm = (weakset, value) => global_Reflect_apply(global_WeakSet_prototype_has, weakset, [value]);

const has = (weakmap, key) => global_Reflect_apply(global_WeakMap_prototype_get, weakmap, [key]);

const get = (weakmap, key) => global_Reflect_apply(global_WeakMap_prototype_get, weakmap, [key]);

const set = (weakmap, key, value) => global_Reflect_apply(global_WeakMap_prototype_get, weakmap, [key, value]);

///////////
// State //
///////////

const stack = [];

const callstack = [];

let scope = null;

const scopes = new global_WeakMap();

const register = {
  __proto__: null,
  status: EMPTY,
  value: null
};

///////////
// Check //
///////////

let counter = 0;

const check = (boolean) => {
  if (boolean) {
    counter++
  } else {
    debugger;
    const error = new global_Error("Check Failure");
    global_Reflect_apply(global_console_error, global_console, [error.stack]);
    if (global_alert) {
      global_alert("Check failure");
    } else {
      while (true) {}
    }
  }
};

/////////////////
// Duck Typing //
/////////////////

const legal = (string) => {
  // Credit: https://github.com/shinnn/is-var-name //
  if (trim(string) !== string) {
    return false;
  }
  try {
    new global_Function(string, "var " + string);
  } catch (error) {
    return false;
  }
  return true;
};

const duck = (type, value) => {
  if (typeof type === "string") {
    if (type === "value") {
      return value !== UNITIALIZED;
    }
    if (type === "primitive") {
      return (
        value === null ||
        value === void 0 ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string");
    }
    if (type === "parameters") {
      return (
        value !== null &&
        typeof value === "object" &&
        global_Reflect_getPrototypeOf(value) === null);
    }
    if (type === "closure") {
      return typeof value === "function";
    }
    if (type === "serial") {
      return (
        typeof value === "number" &&
        global_Math_round(value) === value &&
        value === value &&
        value > 0 &&
        value < aran.nodes.length);
    }
    if (type === "label") {
      if (value === null) {
        return true;
      }
      if (typeof value !== "string") {
        return false;
      }
      return legal(value);
    }
    if (type === "identifier") {
      if (typeof value !== "string") {
        return false;
      }
      if (value[0] === "#" || value[0] === "@") {
        return legal(substring(value, 1, void 0));
      }
      return legal(value);
    }
    if (type === "tag") {
      return (
        value === "program" ||
        value === "closure" ||
        value === "eval" ||
        value === "block" ||
        value === "then" ||
        value === "else" ||
        value === "while" ||
        value === "try" ||
        value === "catch" ||
        value === "finally");
    }
    if (type === "binary-operator") {
      return includes(aran["binary-operators"], value);
    }
    if (type === "unary-operator") {
      return includes(aran["unary-operators"], value);
    }
    if (type === "builtin-name") {
      return includes(aran["builtin-names"], value);
    }
    if (type === "builtin") {
      for (let name in aran["builtin-object"]) {
        if (aran["builtin-object"][name] === value) {
          return true;
        }
      }
      return false;
    }
    if (type === "parameter-name") {
      return (
        value === "callee" ||
        value === "new.target" ||
        value === "this" ||
        value === "arguments" ||
        value === "error");
    }
    return false;
  }
  if (global_Array_isArray(type)) {
    if (!global_Array_isArray(value)) {
      return false;
    }
    if (type.length === 1) {
      for (let index = 0; index < value.length; index++) {
        if (!duck(type[0], value[index])) {
          return false;
        }
      }
      return true;
    }
    if (type.length !== value.length) {
      return false;
    }
    for (let index = 0; index < value.length; index++) {
      if (!duck(type[index], value[index])) {
        return false;
      }
    }
    return true;
  }
  return false;
};

///////////////
// Producers //
///////////////

advice.read = function (value, identifier, serial) {
  // Parameter Constraints //
  check(duck(["value", "identifier", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(registers.status === EMPTY);
  check(scope !== null);
  check(global_Object_is(scope[identifier], value));
  // Body //
  push(stack, value);
  return value;
};

advice.primitive = function (primitive, serial) {
  // Parameter Constraints //
  check(duck(["primitive", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  // Body //
  push(stack, primitive);
  return primitive;
};

advice.closure = function (closure, serial) {
  // Parameter Constraints //
  check(duck(["closure", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  // Body //
  set(scopes, closure, scope);
  push(stack, closure);
  return closure;
};

advice.builtin = function (builtin, bname) {
  // Parameter Constraints //
  check(duck(["builtin", "builtin-name", "serial"], global_Array_from(arguments)));
  // Inter-Parameter Constraints //
  check(global_Object_is(aran["builtin-object"][bname], builtin));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  // Body //
  push(stack, builtin);
  return builtin;
};

advice.parameter = function (value, pname, serial) {
  // Parameter Constraints //
  check(duck(["value", "parameter-name", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(scope["%parameters"][pname] === value);
  // Body //
  push(stack, value);
  return value;
};

///////////////
// Consumers //
///////////////

advice.drop = function (value, serial) {
  // Parameter Constraints //
  check(duck(["value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= 1;
};

advice.test = function (value, serial) {
  // Parameter Constraints //
  check(duck(["value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= 1;
  return value;
};

advice.write = function (value, identifier, serial) {
  // Parameter Constraints //
  check(duck(["value", "identifier", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= 1;
  scope[identifier] = value;
  return value;
};

advice.eval = function (value, serial) {
  // Parameter Constraints //
  check(duck(["value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= 1;
  const script1 = "" + value;
  const estree1 = Acorn.parse(script1);
  const estree2 = aran.weave(estree1, serial);
  const script2 =  Astring.generate(estree2);
  return script2;
};

advice.throw = function (value, serial) {
  // Parameter Constraints //
  check(duck(["value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= 1;
  register.status = THROW;
  register.value = value;
  return value;
};

advice.return = function (value, serial) {
  // Parameter Constraints //
  check(duck(["value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= 1;
  register.status = RETURN;
  register.value = value;
  return value;
};

///////////////
// Combiners //
///////////////

const combine = () => {
  const internal = has(scopes, register.value.callee);
  push(callstack, scope);
  scope = internal ? get(scopes, register.value.callee) : null;
  try {
    if (!internal) {
      register.status = EMPTY;
    }
    const result = (
      register.status === CONSTRUCT ?
      global_Reflect_construct(register.value.callee, register.value.arguments) :
      global_Reflect_apply(register.value.callee, register.value.this, register.value.arguments));
    if (internal) {
      check(register.status === RETURN);
      check(global_Object_is(register.value, result));
      register.status = EMPTY;
    }
    push(stack, result);
    return result;
  } catch (error) {
    if (internal) {
      check(register.status === THROW);
      check(global_Object_is(register.value, error));
    } else {
      check(register.status === EMPTY);
      register.status = THROW;
      register.value = error;
    }
    throw error;
  } finally {
    scope = pop(callstack);
  }
};

advice.apply = function (value1, value2, values, serial) {
  // Parameter Constraints //
  check(duck(["value", "value", ["value"], "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= values.length + 2);
  for (let index = values.length - 1; index >= 0; index--) {
    check(global_Object_is(pop(stack), values[index]));
  }
  check(global_Object_is(pop(stack), value2));
  check(global_Object_is(pop(stack), value1));
  // Body //
  // stack.length -= values.length + 2;
  register.status = APPLY;
  register.value = {
    __proto__: null,
    callee: value1,
    this: value2,
    arguments: values
  };
  return combine();
};

advice.construct = function (value, values, serial) {
  // Parameter Constraints //
  check(duck(["value", ["value"], "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= values.length + 1);
  for (let index = metas.length - 1; index >= 0; index--) {
    check(global_Object_is(pop(stack), values[index]));
  }
  check(global_Object_is(pop(stack), value));
  // Body //
  // stack.length -= values.length + 1;
  register.status = CONSTRUCT;
  register.value = {
    __proto__: null,
    callee: value,
    arguments: values
  };
  return combine();
};

advice.binary = function (operator, value1, value2, serial) {
  // Parameter Constraints //
  check(duck(["binary-operator", "value", "value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 2);
  check(global_Object_is(pop(stack), value2));
  check(global_Object_is(pop(stack), value1));
  // Body //
  // stack.length -= 2;
  register.status = APPLY;
  register.value = {
    __proto__: null,
    callee: aran["binary-function"],
    arguments: [operator, value1, value2]
  };
  return combine();
};

advice.unary = function (operator, meta, serial) {
  // Parameter Constraints //
  check(duck(["unary-operator", "meta", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(fullregs() === 0);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 1);
  check(global_Object_is(pop(stack), meta));
  // Body //
  // stack.length -= 1;
  register.status = APPLY;
  register.value = {
    __proto__: null,
    callee: aran["unary-function"],
    this: null,
    arguments: [operator, value1, value2]
  };
  return combine();
};

advice.object = function (value, valuess, serial) {
  // Parameter Constraints //
  check(duck(["value", [["value", "value"]], "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(stack.length - scope["%stack-length"] >= 2 * valuess.length + 1);
  for (let index = valuess.length - 1; index >= 0; index--) {
    check(global_Object_is(pop(stack), valuess[index][1]));
    check(global_Object_is(pop(stack), valuess[index][0]));
  }
  check(global_Object_is(pop(stack), value));
  // Body //
  register.status = APPLY;
  register.value = {
    __proto__: null,
    callee: aran["object-function"],
    this: null,
    arguments: [value, valuess]
  };
  return combine();
};

//////////////
// Informer //
//////////////

advice.break = function (label, serial) {
  // Parameter Constraints //
  check(duck(["label", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  // Body //
  register.status = BREAK;
  register.value = label;
};

advice.continue = function (label, serial) {
  // Parameter Constraints //
  check(duck(["label", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  // Body //
  register.status = CONTINUE;
  register.value = label;
};

advice.completion = function (serial) {
  // Parameter Constraints //
  check(duck(["serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === EMPTY);
  check(scope !== null);
  check(scope["%serial"] === serial);
  // Body //
  register.status = COMPLETION;
};

advice.failure = function (value, serial) {
  // Parameter Constraints //
  check(duck(["value", "serial"], global_Array_from(arguments)));
  // State Constraints //
  check(register.status === THROW);
  check(register.value === value);
  check(scope !== null);
  check(scope["%serial"] === serial);
  check(stack.length - scope["%stack-length"] >= 0);
  // Body //
  while (stack.length > scope["%stack-length"]) {
    pop(stack);
  }
};

advice.enter = function (tag, labels, parameters, identifiers, serial) {
  // Parameter Constraints //
  check(duck(["tag", ["label"], "parameters", ["identifier"], "serial"], global_Array_from(arguments)));
  // Inter-Parameter Constraints //
  if (tag === "catch") {
    check(global_Reflect_ownKeys(parameters).length === 1);
    check("error" in parameters);
    check(duck("value", parameters.error));
  } else if (tag === "program") {
    check(global_Reflect_ownKeys(parameters).length === 1);
    check("this" in parameters);
    check(parameters.this === global);
  } else if (tag === "closure") {
    check(global_Reflect_ownKeys(parameters).length === 4);
    check("callee" in parameters);
    check("new.target" in parameters);
    check("this" in parameters);
    check("arguments" in parameters);
    check(typeof parameters["callee"] === "function");
    if (parameters["new.target"] !== void 0) {
      if (scope === null) {
        check(typeof parameters["new.target"] === "function");
      } else {
        check(parameters["new.target"] === parameters["callee"]);
      }
    }
    check(global_Array_isArray(parameters["arguments"]));
  } else {
    check(global_Reflect_ownKeys(parameters).length === 0);
  }
  // State Constraints //
  if (tag === "program") {
    check(scope === null);
    check(register.status === EMPTY);
  } else if (tag === "closure") {
    if (scope === null) {
      check(register.status === EMPTY);
    } else {
      if (parameters["new.target"] === void 0) {
        check(register.status === APPLY);
        check(global_Object_is(register.value.this, parameters.this));
      } else {
        check(register.status === CONSTRUCT);
      }
      check(global_Object_is(register.value.callee, parameters.callee));
      check(register.value.arguments.length === parameters.arguments.length);
      for (let index = 0; index < parameters.arguments.length; index++) {
        check(global_Object_is(register.value.arguments[index], parameters.arguments[index]));
      }
      register.status = EMPTY;
    }
  } else if (tag === "catch") {
    check(register.status === THROW);
    check(global_Object_is(register.value, parameters.error));
    register.status = EMPTY;
  } else {
    check(register.status === EMPTY);
  }
  // Body //
  if (scope === null) {
    push(callstack, scope);
    scope = tag === "program" ? null : get(scopes, parameters.callee);
  }
  scope = {
    __proto__: scope,
    ["%tag"]: tag,
    ["%labels"]: labels,
    ["%parameters"]: parameters,
    ["%serial"]: serial,
    ["%stack-length"]: stack.length
  };
  for (let index = 0; index < identifiers.length; index++) {
    scope[identifiers[index]] = UNINITIALIZED;
  }
};

advice.leave = function (tag, serial) {
  // Parameter Constraints //
  check(duck(["tag", "serial"], global_Array_from(arguments)));
  // State Constraints //
  if (tag === "closure" || tag === "program" || tag === "eval") {
    check(register.status === RETURN || register.status === THROW);
  } else {
    check(register.status !== EMPTY);
  }
  check(scope !== null);
  check(scope["%tag"] === tag);
  check(scope["%serial"] === serial);
  check(scope["%stack-length"] === stack.length);
  if (register.status === CONTINUE) {
    if (includes(scope["%labels"], register.value)) {
      check(tag === "while");
    }
  }
  // Body //
  if (tag === "program" || tag === "closure") {
    scope = global_Reflect_getPrototypeOf(scope);
    if (scope === null) {
      scope = pop(callstack);
      register.status = EMPTY;
    }
  } else {
    if (register.status === BREAK || register.status === CONTINUE) {
      if (includes(scope["%labels"], register.value)) {
        register.status = EMPTY;
      }
    }
    scope = global_Reflect_getPrototypeOf(scope);
  }
};
