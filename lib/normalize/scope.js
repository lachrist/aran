
const ArrayLite = require("array-lite");
const Object = require("./object.js");
const Identifier = require("../identifier.js");
const Global = require("./global.js");
const Build = global.Object.assign({__proto__:null}, require("./build.js"));
Build.eval = Build._eval;
Build.read = Build._read;
Build.write = Build._write;
Build.BLOCK = Build._BLOCK;

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
const WRITABLE = "V";
const DYNAMIC_DEADZONE = "Z";
const TYPEOF = "T";
const READ = "R";
const WRITE = "W";
const DELETE = "D";

const PARENT = global_Symbol("parent");
const STRICT = global_Symbol("strict");
const WITH = global_Symbol("with");
const CLOSURE = global_Symbol("closure");

const lookup = (scope, key) => (
  scope === null ?
  void 0 :
  (
    key in scope ?
    scope[key] :
    lookup(scope[PARENT], key)));

const hide = (scope, $identifier) => {
  let index = 0;
  while (lookup(scope, Identifier.Meta("$" + $identifier + index)) !== void 0) {
    index++;
  }
  const identifier = Identifier.Meta("$" + $identifier + index);
  scope[identifier] = null;
  return identifier;
};

const tdz = ($identifier) => Identifier.Meta("_" + $identifier);

const const_null = () => null;

const visitors = {__proto__:null};

ArrayLite.forEach(global_Reflect_ownKeys(Syntax.expression), (constructor) => {
  visitors[constructor] = const_null;
});

visitors.primitive = (primitive, node) => ["primitive", primitive]

visitors.identifier = (read: (aran_identifier, node) => (
  (
    aran_identifier === Identifier.Base("new.target") ||
    aran_identifier === Identifier.Base("this")) ?
  ["base", aran_identifier] :
  (
    (
      aran_identifier === Identifier.Parameter("callee") ||
      aran_identifier === Identifier.Parameter("new.target") ||
      aran_identifier === Identifier.Parameter("this") ||
      aran_identifier === Identifier.Parameter("arguments") ||
      aran_identifier === Identifier.Parameter("error")) ?
    ["parameter", aran_identifier] :
    null));

///////////////
// Non-Build //
///////////////

exports.$IsStrict = (scope) => lookup(scope, STRICT) === null;

///////////
// Cache //
///////////

exports.get = (scope, cache) => {
  if (cache[0] === "base") {
    const binding = lookup(sope, cache[1]);
    if (binding === void 0) {
      throw new global_Error("Unbound base cache");
    }
    if (binding === null) {
      throw new global_Error("Base cache is linked to a meta identifier");
    }
    return Build.read(cache[1]);
  }
  if (cache[0] === "meta") {
    const binding = lookup(sope, cache[1]);
    if (binding === void 0) {
      throw new global_Error("Unbound meta cache");
    }
    if (binding !== null) {
      throw new global_Error("Base cache is linked to a base identifier");
    }
    return Build.read(cache[1]);
  }
  if (cache[0] === "parameter") {
    return Build.read(cache[1]);
  }
  if (cache[0] === "primitive") {
    return Build.primitive(cache[1]);
  }
  throw new global_Error("Invalid cache tag");
};

exports.set = (scope, cache, aran_expression) => {
  if (cache[0] !== "meta") {
    throw new global_Error("Only meta caches are writables");
  }
  const binding = lookup(sope, cache[1]);
  if (binding === void 0) {
    throw new global_Error("Unbound meta cache");
  }
  if (binding !== null) {
    throw new global_Error("Base cache is linked to a base identifier");
  }
  return Build.write(cache.identifier, aran_expression);
};

exports.cache = (scope, estree_identifier, aran_expression, is_readonly, closure) => (
  _nullable_cache = (
    is_readonly ?
    Visit("expression", aran_expression, 1, false, visitors) :
    null),
  (
    _nullable_cache === null ?
    (
      _aran_identifier = hide(estree_identifier, scope),
      Build.sequence(
        Build.write(_aran_identifier, aran_expression),
        closure(
          {
            __proto__: null,
            identifier: _aran_identifier}))) :
    closure(_nullable_cache)));

exports.Cache = (scope, estree_identifier, aran_expression, is_readonly, closure) => (
  _nullable_cache = (
    is_readonly ?
    Visit("expression", aran_expression, 1, false, visitors) :
    null),
  (
    _nullable_cache === null ?
    (
      _aran_identifier = hide(estree_identifier, scope),
      ArrayLite.concat(
        Build.Expression(
          Build.write(_aran_identifier, aran_expression)),
        closure(
          {
            __proto__: null,
            identifier: _aran_identifier}))) :
    closure(_nullable_cache)));

///////////
// Block //
///////////

const block = (scope, strict, $identifiers1, $identifiers2, closures, closure) => {
  if (strict) {
    scope[STRICT] = null;
  }
  ArrayLite.forEach([$identifiers1, $identifiers2], ($identifiers, index) => {
    ArrayLite.forEach($identifiers, ($identifier) => {
      const identifier = Identifier.Base($identifier);
      if (identifier in scope) {
        throw new global_Error("Duplicate declaration");
      }
      scope[identifier] = {
        __proto__: null,
        [INITIALIZED]: false,
        [WRITABLE]: index === 0,
        [DYNAMIC_DEADZONE]: false,
        [TYPEOF]: false,
        [READ]: false,
        [WRITE]: false,
        [DELETE]: false
      };
    });
  });
  ArrayLite.forEach(global_Reflect_ownKeys(closures), ($identifier) => {
    const identifier = Identifier.Base($identifier);
    if (!($identifier in scope)) {
      throw new global_Error("Missing pre-initialized identifier");
    }
    scope[identifier][INITIALIZED] = true;
  });
  const statements = closure(scope);
  return Build.BLOCK(
    global_Reflect_ownKeys(scope),
    Array.concat(
      ArrayLite.flatMap(
        ArrayLite.concat($identifiers1, $identifiers2),
        ($identifier) => (
          (
            scope[Identifier.Base($identifier)] !== null &&
            scope[Identifier.Base($identifier)][DYNAMIC_DEADZONE]) ?
          Build.Expression(
            Build.write(
              tdz($identifier),
              Build.primitive(false))) :
          [])),
      ArrayLite.flatMap(
        ArrayLite.filter(
          global_Reflect_ownKeys(closures),
          ($identifier) => (
            scope[Identifier.Base($identifier)][TYPEOF] ||
            scope[Identifier.Base($identifier)][READ])),
        ($identifier) => Build.Expression(
          Build.write(
            Identifier.Base($identifier),
            closures[$identifier]()))),
      statements1));
};

exports.BLOCK = (scope, strict, $identifiers1, $identifiers2, closure) => block(
  {
    __proto__: null,
    [PARENT]: scope,
    [CLOSURE]: false},
  strict,
  $identifiers1,
  $identifiers2,
  {
    __proto__: null},
  closure);

exports.CLOSURE = (scope, strict, $identifiers1, $identifiers2, closures, closure) => block(
  {
    __proto__: null,
    [PARENT]: scope,
    [CLOSURE]: true},
  strict,
  $identifiers1,
  $identifiers2,
  closures,
  closure);

exports.WITH = (scope, cache, $identifiers1, $identifiers2, closure) => (
  "identifier" in cache ?
  block(
    {
      __proto__: null,
      [PARENT]: scope,
      [CLOSURE]: false,
      [WITH]: cache.identifier},
    false,
    $identifiers1,
    $identifiers2,
    {
      __proto__: null},
    closure) :
  (
    (
      () => { throw new global_Error("Invalid cache for with environment") })
    ()));

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
