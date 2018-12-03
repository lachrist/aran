
NAMESPACE._builtin_eval = eval;
NAMESPACE._builtin_global = NAMESPACE._builtin_eval("this");
NAMESPACE._builtin_ReferenceError = ReferenceError;
NAMESPACE._builtin_RegExp = RegExp;
NAMESPACE._builtin_TypeError = TypeError;
NAMESPACE._builtin_Object = Object;
NAMESPACE._builtin_Reflect_has = Reflect.has;
NAMESPACE._builtin_Reflect_get = Reflect.get;
NAMESPACE._builtin_Reflect_set = Reflect.set;
NAMESPACE._builtin_Reflect_apply = Reflect.apply;
NAMESPACE._builtin_Reflect_construct = Reflect.construct;
NAMESPACE._builtin_Reflect_deleteProperty = Reflect.deleteProperty;
NAMESPACE._builtin_Symbol_unscopables = Symbol.unscopables;
NAMESPACE._builtin_Symbol_iterator = Symbol.iterator;
NAMESPACE._builtin_Object_getOwnPropertyNames = Object.getOwnPropertyNames;
NAMESPACE._builtin_Object_defineProperty = Object.defineProperty;
NAMESPACE._builtin_Object_keys = Object.keys;
NAMESPACE._builtin_Object_getPrototypeOf = Object.getPrototypeOf;
NAMESPACE._builtin_Array_of = Array.of;
NAMESPACE._builtin_Array_prototype_concat = Array.prototype.concat;

NAMESPACE._builtin_AranThrowReferenceError = function AranThrowReferenceError (message) {
  throw new NAMESPACE._builtin_ReferenceError(message);
};

NAMESPACE._builtin_AranThrowTypeError = function AranThrowTypeError (message) {
  throw new NAMESPACE._builtin_TypeError(message);
};

NAMESPACE._builtin_AranConvert = function AranConvert (object) {
  if (object === null || object === void 0)
    return object;
  return NAMESPACE._builtin_Object(object);
};

NAMESPACE._builtin_AranHold = function AranHold (object, name) {
  while (object) {
    var names = NAMESPACE._builtin_Object_getOwnPropertyNames(object);
    var index = names.length;
    while (index--) {
      if (names[index] === name) {
        return true;
      }
    }
    object = NAMESPACE._builtin_Object_getPrototypeOf(object);
  }
  return false;
};

NAMESPACE._builtin_AranRest = function AranRest (iterator) {
  var result = [];
  for (var step = iterator.next(); !step.done; step = iterator.next()) {
    result[result.length] = step.value;
  }
  return result;
};

NAMESPACE._builtin_AranInitializeObject = function AranInitializeObject () {
  var object = {};
  for (var index = 0, length = arguments.length; index < length; index += 3) {
    NAMESPACE._builtin_Object_defineProperty(object, arguments[index+1], (
      arguments[index] === "init" ?
      {configurable:true, writable:true, enumerable:true, value:arguments[index+2]} :
      {configurable:true, enumerable: true, [arguments[index]]:arguments[index+2]}));
  }
  return object;
};

NAMESPACE._builtin_AranUnary = function AranUnary (operator, argument) {
  switch (operator) {
    case "-": return -argument;
    case "+": return +argument;
    case "!": return !argument;
    case "~": return ~argument;
    case "typeof": return typeof argument;
    case "void": return void argument;
    case "delete": return delete argument;
  }
  throw new NAMESPACE._builtin_TypeError("Unrecognized operator: "+operator);
};

NAMESPACE._builtin_AranBinary = function AranBinary (operator, left, right) {
  switch (operator) {
    case "==": return left == right;
    case "!=": return left != right;
    case "===": return left === right;
    case "!==": return left !== right;
    case "<": return left < right;
    case "<=": return left <= right;
    case ">": return left > right;
    case ">=": return left >= right;
    case "<<": return left << right;
    case ">>": return left >> right;
    case ">>>": return left >>> right;
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/": return left / right;
    case "%": return left % right;
    case "|": return left | right;
    case "^": return left ^ right;
    case "&": return left & right;
    case "in": return left in right;
    case "instanceof": return left instanceof right;
  }
};
