
const ArrayLite = require("array-lite");
const Object = require("./object.js");
const Identifier = require("../identifier.js");
const Global = require("./global.js");
const Build = global.Object.assign({__proto__:null}, require("./build.js"));
Build.eval = Build._eval;
Build.read = Build._read;
Build.write = Build._write;
Build.BLOCK = Build._BLOCK;

// function f (x, y, z) {
//   Reflect.defineProperty(arguments, 0, {__proto__: null, set: () => console.log("wesh"), get:() => "foo", configurable:true, enumerable:true});
//   Reflect.defineProperty(arguments, 0, {__proto__: null, writable: true, value: "foo", configurable:true, enumerable:true});
//   // Reflect.defineProperty(arguments, 0, {__proto__: null, writable: true, value:"foo", configurable:true, enumerable:true});
//   // Reflect.defineProperty(arguments, 0, {__proto__: null, writable: false, value:"foo", configurable:false, enumerable:true});
//   x = "bar";
//   console.log(Object.getOwnPropertyDescriptors(arguments));
//   return x;
// }
// 
// function f (x) {
//   eval("var x; console.log(x)");
// }
// 
// const bool_x = ;
// const bool_y;
// const bool_z;
// const raw_args = ...;
// const arguments = new Proxy({
//   raw_args,
//   {
//     ["defineProperty"]: (tgt, key, des1) => {
//       const result = Reflect.defineProperty(tgt, key, des1);
//       if (result && bool_x && key === "0") {
//         const des2 = Reflect.getOwnProperty(tgt, key);
//         if (Reflect.getOwnPropertyDescriptor(des, "value")) {
//           x = Reflect.get(des, "value");
//         } else {
//           bool_x = false;
//         }
//       } else if (bool_y && key === "1") {
// 
//       } else if (bool_z && key === "2") {
// 
//       }
//       return result;
//     }
//   },
// });

const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;
const global_Reflect_setPrototypeOf = global.Reflect.setPrototypeOf;
const global_Object_hasOwnProperty = global.Object.hasOwnProperty;
const global_Object_assign = global.Object.assign;
const global_JSON_stringify = global.JSON.stringify;
const global_JSON_parse = global.JSON.parse;
const global_Array_from = global.Array.from;
const global_Error = global.Error;
const global_Symbol = global.Symbol;

const INITIALIZED = "I";
const WRITABLE = "W";
const DYNAMIC_DEADZONE = "Z";
// const TYPEOF = "T";
// const READ = "R";
// const WRITE = "W";
// const DELETE = "D";

const PARENT = global_Symbol("parent");
const STRICT = global_Symbol("strict");
const WITH = global_Symbol("with");
const CLOSURE = global_Symbol("closure");

const CACHE_PREFIX = "$";
const TDZ_PREFIX = "_";

const lookup = (scope, key) => (
  scope === null ?
  void 0 :
  (
    key in scope ?
    scope[key] :
    lookup(scope[PARENT], key)));

const Cache = {__proto__:null};
{
  const IS_PRIMITIVE = "P";
  const IS_READ_ONLY = "R";
  const VALUE = "V";
  Cache.get = (scope, cache) => {
    if (cache[IS_PRIMITIVE]) {
      return Build.primitive(cache[VALUE]);
    }
    if (lookup(scope, cache[VALUE]) === void 0) {
      throw new global_Error("Unbound identifier cache");
    }
    return Build.read(cache[VALUE]);
  };
  Cache.set = (scope, cache, aran_expression) => {
    if (cache[IS_PRIMITIVE]) {
      throw new global_Error("Cannot write to primitive cache");
    }
    if (cache[IS_READ_ONLY]) {
      throw new global_Error("Cannot write to readonly identifier cache");
    }
    if (lookup(scope, cache[VALUE]) === void 0) {
      throw new global_Error("Unbound identifier cache");
    }
    return Build.write(cache[VALUE], aran_expression);
  };
  {
    const visitors = {__proto__:null};
    {
      const CACHE_BINDING = {
        __proto__: null,
        [INITIALIZED]: true,
        [WRITABLE]: true,
        [DYNAMIC_TDZ]: false
      };
      // global_Object_freeze(CACHE_BINDING);
      const hide = function (aran_expression) => {
        let index = 0;
        while (lookup(this.__scope__, Identifier.Meta(CACHE_PREFIX + this.__estree_identifier__ + index)) !== void 0) {
          index++;
        }
        const aran_identifier = Identifier.Meta(CACHE_PREFIX + this.__estree_identifier__ + index);
        scope[aran_identifier] = CACHE_BINDING;
        return [{
          __proto__:null,
          [IS_PRIMITIVE]: false,
          [IS_READ_ONLY]: false,
          [VALUE]: aran_identifier
        }, Build.write(aran_identifier, aran_expression)];
      };
      for (let constructor in Syntax.expression) {
        visitors[constructor] = hide;
      }
      visitors.sequence = function (aran_expression, aran_expression1, aran_expression2, _array) { return (
        _array = Visit("expression", aran_expression2, 1, false, this),
        [
          _array[0],
          (
            _array[1] === null ?
            aran_expression1 :
            Build.sequence(_aran_expression1, _array[1]))]) },
      visitors.primitive = function (aran_expression, primitive) { return
        this.__is_readonly__ ?
        [
          {
            __proto__:null,
            [IS_PRIMITIVE]: true,
            [IS_READ_ONLY]: false,
            [VALUE]: aran_identifier},
          null] :
        global_Reflect_apply(hide, this, [aran_expression]) };
      visitors.read = function (aran_expression, aran_identifier) { return (
        (
          this.__is_readonly__ &&
          (
            aran_identifier === Identifier.Base("new.target") ||
            aran_identifier === Identifier.Base("this") ||
            aran_identifier === Identifier.Parameter("callee") ||
            aran_identifier === Identifier.Parameter("new.target") ||
            aran_identifier === Identifier.Parameter("this") ||
            aran_identifier === Identifier.Parameter("arguments") ||
            aran_identifier === Identifier.Parameter("error"))) ?
        [
          {
            __proto__:null,
            [IS_PRIMITIVE]: false,
            [IS_READ_ONLY]: true,
            [VALUE]: aran_identifier},
          null] :
        global_Reflect_apply(hide, this, [aran_expression]))};
    }
    const make = (scope, is_readonly, estree_identifier, aran_expression) => Visit(
      "expression",
      aran_expression,
      1,
      false,
      {
        __proto__: visitors,
        __scope__: scope,
        __is_readonly__: is_readonly,
        __estree_identifier__: estree_identifier});
    Cache.cache = (scope, is_readonly, estree_identifier, aran_expression, closure, _cache, _nullable_cache) => (
      {0:_cache, 1:_nullable_expression} = make(scope, is_readonly, estree_identifier, aran_expression),
      (
        _nullable_expression === null ?
        closure(_cache) :
        Build.sequence(
          _nullable_expression,
          closure(_cache)))),
    Cache.Cache = (scope, is_readonly, estree_identifier, aran_expression, closure, _cache, _nullable_cache) => (
      {0:_cache, 1:_nullable_expression} = make(scope, is_readonly, estree_identifier, aran_expression),
      (
        _nullable_expression === null ?
        closure(_cache) :
        ArrayLite.concat(
          Build.Expression(_nullable_expression),
          closure(_cache))));
  }
}

///////////////
// Non-Build //
///////////////

exports.$IsStrict = (scope) => lookup(scope, STRICT) === null;

///////////
// Cache //
///////////

exports.get = Cache.get;
exports.set = Cache.set;
exports.cache = Cache.cache;
exports.Cache = Cache.Cache;

///////////
// Block //
///////////

const block = (scope, strict, estree_identifiers1, estree_identifiers2, closure) => {
  if (strict) {
    scope[STRICT] = null;
  }
  ArrayLite.forEach([true, false], (boolean) => {
    ArrayLite.forEach(boolean ? estree_identifiers1 : estree_identifiers2, (estree_identifier) => {
      const aran_identifier = Identifier.Base(estree_identifier);
      if (aran_identifier in scope) {
        throw new global_Error("Duplicate declaration");
      }
      scope[aran_identifier] = {
        __proto__: null,
        [INITIALIZED]: false,
        [WRITABLE]: boolean,
        [DYNAMIC_DEADZONE]: false,
      };
    });
  });
  const statements = closure(scope);
  return Build.BLOCK(
    global_Reflect_ownKeys(scope),
    Array.concat(
      ArrayLite.flatMap(
        ArrayLite.concat(estree_identifiers1, estree_identifiers2),
        (estree_identifier) => (
          scope[Identifier.Base(estree_identifier)][DYNAMIC_DEADZONE] ?
          Build.Expression(
            Build.write(
              Identifier.Meta(TDZ_PREFIX + estree_identifier),
              Build.primitive(false))) :
          [])),
      statements));
};

exports.BLOCK = (scope, strict, estree_identifiers1, estree_identifiers2, closure) => block(
  {
    __proto__: null,
    [PARENT]: scope,
    [CLOSURE]: false},
  strict,
  estree_identifiers1,
  estree_identifiers2,
  closure);

exports.CLOSURE = (scope, strict, estree_identifiers1, estree_identifiers2, closure) => block(
  {
    __proto__: null,
    [PARENT]: scope,
    [CLOSURE]: true},
  strict,
  estree_identifiers1,
  estree_identifiers2,
  closure);

exports.WITH = (scope, cache, estree_identifiers1, estree_identifiers2, closure) => block(
  {
    __proto__: null,
    [PARENT]: scope,
    [CLOSURE]: false,
    [WITH]: cache},
  false,
  estree_identifiers1,
  estree_identifiers2,
  closure);

////////////////
// Initialize //
////////////////

exports.initialize = (scope, $identifier, expression) => {
  const identifier = Identifier.Base($identifier);
  if (!(identifier in scope)) {
    throw new global_Error("Distant initialization");
  }
  if (scope[identifier][INITIALIZED]) {
    throw new global_Error("Duplicate initialization");
  }
  scope[identifier][INITIALIZED] = true;
  return (
    scope[identifier][DYNAMIC_DEADZONE] ?
    Build.sequence(
      Build.write(
        tdz($identifier),
        Build.primitive(true)),
      Build.write(identifier, expression)) :
    Build.write(identifier, expression));
};

////////////////////////////////////
// Read / Write / Typeof / Delete //
////////////////////////////////////

// Special lookup on global
// > Reflect.setPrototypeOf(global, new Proxy({__proto__:null}, {
//   proto__: null,
//   has: (tgt, key) => (console.log("has", key), Reflect.has(tgt, key)),
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
//   set: (tgt, key, val, rec) => (console.log("set", key), Reflect.set(tgt, key, val, rec)),
//   ownKeys: (tgt) => (console.log("keys"), Reflect.ownKeys(tgt)),
//   getOwnPropertyDescriptor: (tgt, key) => (
//     console.log("getOwnPropertyDescriptor", key),
//     Reflect.getOwnPropertyDescriptor(tgt, key)),
//   getPrototypeOf: (tgt) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(tgt))
// }));
// > function f () { "use strict"; foo = 123 }
// > f()
// set foo

const access1 = (tag, $identifier, binding, escaped, closure1, _closure2) => (
  binding[tag] = true,
  _closure2 = () => Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + object.$identifier + "' before initalization")]),
  (
    binding[INITIALIZED] ?
    closure1() :
    (
      escaped ?
      _closure2() :
      (
        binding[DYNAMIC_DEADZONE] = true,
        Build.conditional(
          Build.read(
            Identifier.Meta("TDZ" + Identifier.Base(object.$identifier))),
          closure1(),
          _closure2())))));

// Unscopables are taken into account only if proper object / function:
// 
// > String.prototype.foo = true;
// > "bar".foo
// true
// with ({foo:123, [Symbol.unscopables]:"bar"}) { foo }
// > 123
//
// (
//   Reflect.has(<with>, "<identifier>") ?
//   (
//     <cache> = Reflect.get(<with>, Symbol.unscopables),
//     (
//       (
//         typeof <cache> === "object" ?
//         <cache> :
//         typeof <cache> === "function") ?
//       !Reflect.get(<cache>, "<identifier>") :
//       true)) :
//    false) ?
// <closure1()>
// <closure2()>)
const access2 = ($identifier, scope1, scope2, closure1, closure2) => Build.conditional(
  Build.conditional(
    Object.has(
      Build.read(scope1[WITH]),
      Build.primitive($identifier)),
    (
      (
        (identifier) => Build.sequence(
          Build.write(
            identifier,
            Object.get(
              Build.read(scope1[WITH]),
              Build.builtin("Symbol.unscopables"))),
          Build.conditional(
            Build.conditional(
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Build.read(identifier)),
                Build.primitive("object")),
              Build.read(identifier),
              Build.binary(
                "===",
                Build.unary(
                  "typeof",
                  Build.read(identifier)),
                Build.primitive("function"))),
            Build.unary(
              "!",
              Object.get(
                Build.read(identifier),
                Build.primitive($identifier))),
            Build.primitive(true))))
      (
        hide(scope2, "ScopeLookupUnscopables"))),
    Build.primitive(false)),
  closure1(),
  closure2());

const typeoflookup = (scope1, $identifier, escaped, scope2) => (
  scope1 === null ?
  Build.unary(
    "typeof",
    Object.get(
      Build.builtin("global"),
      Build.primitive($identifier))) :
  (
    Identifier.Base($identifier) in scope1 ?
    access1(
      TYPEOF,
      $identifier,
      scope1[Identifier.Base($identifier)],
      escaped,
      () => Build.unary(
        "typeof",
        Build.read(
          Identifier.Base(object.$identifier)))) :
    (
      WITH in scope1 ?
      access2(
        $identifier,
        scope1,
        scope2,
        () => Build.unary(
          "typeof",
          Object.get(
            Build.read(scope1[WITH]),
            Build.primitive($identifier))),
        () => typeoflookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2)) :
      typeoflookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2))));

const readlookup = (scope1, $identifier, escaped, scope2) => (
  scope1 === null ?
  Build.conditional(
    Object.has(
      Build.builtin("global"),
      Build.primitive($identifier)),
    Object.get(
      Build.builtin("global"),
      Build.primitive($identifier)),
    Build.throw(
      Build.construct(
        Build.builtin("ReferenceError"),
        [
          Build.primitive($identifier + " is not defined")]))) :
  (
    Identifier.Base($identifier) in scope1 ?
    access1(
      READ,
      $identifier,
      scope1[Identifier.Base($identifier)],
      escaped,
      () => Build.read(
        Identifier.Base($identifier))) :
    (
      WITH in scope1 ?
      access2(
        $identifier,
        scope1,
        scope2,
        () => Object.get(
          Build.read(scope[WITH]),
          Build.primitive(object.$identifier)),
        () => readlookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2)) :
      readlookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2))));

const writelookup = (scope1, $identifier, escaped, scope2, expression) => (
  scope1 === null ?
  (
    lookup(scope2, [STRICT]) === null ?
    // First evaluate the expression then check if it exists in the global object
    (
      (
        (identifier) => Build.sequence(
          Build.write(identifier, expression),
          Build.conditional(
            Object.has(
              Build.builtin("global"),
              Build.primitive($identifier)),
            Object.set(
              true,
              Build.builtin("global"),
              Build.primitive($identifier),
              Build.read(identifier)),
            Build.throw(
              Build.construct(
                Build.builtin("ReferenceError"),
                [
                  Build.primitive(object.$identifier + " is not defined")])))))
      (
        hide(scope2, "ScopeLookupGlobalRight"))) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive($identifier),
      expression)) :
  (
    Identifier.Base($identifier) in scope1 ?
    access1(
      WRITE,
      $identifier,
      scope1[Identifier.Base($identifier)],
      escaped,
      () => (
        scope[Identifier.Base(object.$identifier)][WRITABLE] ?
        Build.write(
          Identifier.Base(object.$identifier),
          object.expression) :
        Build.throw(
          Build.construct(
            Build.builtin("TypeError"),
            [
              Build.primitive("Assignment to a constant variable")])))) :
    (
      "WITH" in scope1 ?
      (
        (
          (identifier) => Build.sequence(
            Build.write(identifier, expression),
            access2(
              $identifier,
              scope1,
              scope2,
              () => Object.set(
                lookup(scope2, STRICT) === null,
                Build.read(scope1[WITH]),
                Build.primitive($identifier),  
                Build.read(identifier)),
              () => writelookup(
                scope1[PARENT],
                $identifier,
                escaped || CLOSIURE in scope1,
                scope2,
                Build.read(identifier)))))
            (
              object.expression = Build.read(meta),
              closure(
                () => Object.set(
                  lookup(scope, STRICT) === null,
                  Build.read(scope[WITH]),
                  Build.primitive(object.$identifier),  
                  Build.read(meta))))) :
        writelookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2, expression))));

const deletelookup = (scope1, $identifier, escaped, scope2) => (
  scope1 === null ?
  Object.del(
    false, // delete <id> is forbidden in strict mode
    Build.builtin("global"),
    Build.primitive($identifier)) :
  (
    Identifier.Base($identifier) in scope1 ?
    access1(
      DELETE,
      $identifier,
      scope1[Identifier.Base($identifier)],
      escaped,
      () => Build.primitive(false)) :
    (
      "WITH" in scope1 ?
      access2(
        $identifier,
        scope1,
        scope2,
        () => Object.del(
          lookup(scope2, STRICT) ===  null,
          Build.read(scope[WITH]),
          Build.primitive(object.$identifier)),
        () => deletelookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2)) :
      deletelookup(scope1[PARENT], $identifier, escaped || scope1[CLOSURE], scope2))));

exports.read = (scope, $identifier) => {
  if ($identifier === "this" || $identifier === "new.target") {
    const binding = lookup(scope, Identifier.Base($identifier));
    if (typeof binding !== "object" || !binding[INITIALIZED]) {
      throw new global_Error("this/new.target should always be initialized");
    }
    return Build.read(Identifier.Base($identifier));
  }
  return readlookup(scope, $identifier, false, scope);
};

exports.typeof = (scope, $identifier) => {
  if ($identifier === "this" || $identifier === "new.target") {
    const binding = lookup(scope, Identifier.Base($identifier));
    if (typeof binding !== "object" || !binding[INITIALIZED]) {
      throw new global_Error("this/new.target should always be initialized");
    }
    return Build.unary("typeof", Build.read(Identifier.Base($identifier)));
  }
  return typeoflookup(scope, $identifier, false, scope);
}

exports.delete = (scope, $identifier) => {
  if ($identifier === "this" || $identifier === "new.target") {
    const binding = lookup(scope, Identifier.Base($identifier));
    if (typeof binding !== "object" || !binding[INITIALIZED]) {
      throw new global_Error("this/new.target should always be initialized");
    }
    return Build.primitive(true);
  }
  return deletelookup(scope, $identifier, false, scope);
};

exports.write = (scope, $identifier, expression) => {
  if ($identifier === "this" || $identifier === "new.target") {
    throw new global("this/new.target are unwritable");
  }
  return writelookup(scope, $identifier, false, scope, expression);
};

//////////
// Eval //
//////////

exports.eval = (scope, expression) => {
  Global.EVALS[Global.SERIAL] = scope;
  const escaped = false;
  while (scope !== null) {
    ArrayLite.forEach(global_Object_getOwnPropertyNames(scope), (identifier) => {
      if (scope[identifier] !== null) {
        scope[identifier][TYPEOF] = true;
        scope[identifier][READ] = true;
        scope[identifier][WRITE] = true;
        scope[identifier][DELETE] = true;
        if (escaped && !scope[identifier][INITIALIZED]) {
          scope[identifier][DYNAMIC_DEADZONE] = true;
        }
      }
    });
    if (scope[CLOSURE]) {
      escaped = true;
    }
  }
  return Build.eval(expression);
};

////////////////
// Parameters //
////////////////

exports.parameter = ($identifier) => Build.read(
  Identifier.Parameter($identifier));
