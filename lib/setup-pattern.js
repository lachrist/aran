
NAMESPACE._builtin_eval = eval;
NAMESPACE._builtin_global = NAMESPACE._builtin_eval("this");
NAMESPACE._builtin_ReferenceError = ReferenceError;
NAMESPACE._builtin_TypeError = TypeError;
NAMESPACE._builtin_RegExp = RegExp;
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

NAMESPACE._builtin_AranRest = function AranRest (iterator) {
  let array = [];
  for (let step = iterator.next(); !step.done; step = iterator.next()) {
    array[array.length] = step.value;
  }
  return array;
};

NAMESPACE._builtin_AranHold = function AranHold (object, name) {
  while (object) {
    if (NAMESPACE._builtin_Reflect_getOwnPropertyDescriptor(object, name)) {
      return true;
    }
    object = NAMESPACE._builtin_Reflect_getPrototypeOf(object);
  }
  return false;
};

NAMESPACE._builtin_AranEumerate = function AranEnumerate (object) {
  const keys1 = [];
  while (object) {
    const keys2 = NAMESPACE._builtin_Object_keys(object);
    for (let index = 0; index < keys2.length; index++) {
      keys1[keys1.length] = keys2[index];
    }
    object = NAMESPACE._builtin_Reflect_getPrototypeOf(object);
  }
  return keys1;
};
