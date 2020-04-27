"use strict";

// https://tc39.es/ecma262/#sec-arguments-exotic-objects

const global_Object_assign = global.Object.assign;

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

///////////
// Block //
///////////

const make_block = (scope, identifiers1, identifiers2, aran_expressions, kontinuation) => {
  ArrayLite.forEach([true, false], (writable) => {
    ArrayLite.forEach(writable ? identifiers1 : identifiers2, (identifier) => {
      const meta_identifier = Identifier.meta(scope, "TDZ_" + identifier);
      Core.declare(scope, meta_identifier, Direct.TAG);
      Core.initialize(scope, meta_identifier);
      aran_expressions[meta_identifier] = Direct.lookup(scope, meta_identifier, Build.primitive(false));
      const base_identifier = Identifier.base(identifier);
      Core.declare(scope, base_identifier, {
        __proto__: null,
        type: "regular",
        writable,
        meta_identifier
      });
    });
  });
  const aran_statements1 = [];
  const aran_statements2 = kontinuation(scope);
  const aran_identifiers = Core.get_identifiers(scope, (aran_identifier, lookedup) => {
    if (aran_identifier in aran_expressions) {
      if (lookedup) {
        aran_statements[aran_statements.length] = Build.Expression(aran_expressions[aran_identifier]);
      }
      return lookedup
    }
    return true;
  };
  return Build.BLOCK(aran_identifiers, ArrayLite.concat(aran_statements1, aran_statements2));
};

// https://www.ecma-international.org/ecma-262/10.0/index.html#sec-functiondeclarationinstantiation

const CALLEE_TAG = {
  __proto__: null,
  type: "callee",
  writable: true
};

const NEW_TARGET_PARAM_TAG = {
  __proto__: null,
  type: "new.target",
  writable: true
};

const THIS_PARAM_TAG = {
  
};

const THIS_PARAM_

const NEW_TARGET_TAG = {
  
};

const CALLBACKS = {
  __proto__: null,
  on_hit: (tag1, kind, tag2, access) => {
    if (tag1.type !== tag2.type) {
      throw new global_Error("")
    }
    if (kind !== "initialized") {
      
    }
    return access(null);
  },
  on_mis: (tag) => {
    throw 
  },
  on_dynamic_frame: (tag, aran_expression, container) => aran_expression
};



exports.make_function_block = (scope, use_strict, nullable_identifier, container, is_simple_parameters, identifiers, kontinuation) => {
  scope = Core.extend(scope, use_strict, true, null);
  const aran_expressions = {__proto__: null};
  // callee //
  if (nullable_identifier !== null && !ArrayLite.includes(identifiers, nullable_identifier)) {
    const base_identifier = Identifier.base(nullable_identifier);
    Core.declare(scope, base_identifier, CALLEE_TAG);
    aran_expressions[base] = Core.initialize(scope, base_identifier, Container.get(scope, container));
  }
  // new.target //
  Core.declare(scope, Identifier.parameter("new.target"), NEW_TARGET_PARAM_TAG);
  Core.initialize(scope, Identifier.parameter("new.target"), null);
  Core.declare(scope, Identifier.base("new.target"), NEW_TARGET_TAG);
  Direct.declare_initialize(scope, {});
  Direct.declare_initialize(scope, Identifier.base("new.target"));
  expressions[Identifier.base("new.target")] = Direct.lookup(
    scope,
    Identifier.base("new.target"),
    Direct.lookup(
      scope,
      Identifier.parameter("new.target"),
      null));
  // this //
  Direct.declare_initialize(scope, Identifier.parameter("this"));
  Direct.declare_initialize(scope, Identifier.base("this"));
  expressions[Identifier.base("this")] = Direct.lookup(
    scope,
    Identifiers.base("this"),
    (
      Core.get_is_strict(scope) ?
      Direct.lookup(
        scope,
        Identifier.parameter("this"),
        null) :
      Build.conditional(
        Build.binary(
          "===",
          Direct.lookup(
            scope,
            Identifier.parameter("this"),
            null),
          Build.primitive(null)),
        Build.builtin("global"),
        Build.conditional(
          Build.binary(
            "===",
            Direct.lookup(
              scope,
              Identifier.parameter("this"),
              null),
            Build.primitive(void 0)),
          Build.builtin("global"),
          Build.apply(
            Build.builtin("Object"),
            Build.primitive(void 0),
            [
              Direct.lookup(
                scope,
                Identifier.parameter("this"),
                null)])))));
  // arguments //
  Data.declare(scope, Identifiers.PARAMETERS["arguments"], null);
  Data.initialize(scope, Identifiers.PARMETERS["arguments"]);
  Data.declare(scope, Identifier.base("arguments"), null);
  Data.initialize(scope, Identifier.base("arguments"));
  expressions[Identifier.base("arguments")] = Build.apply(
    Build.builtin("Object.defineProperty"),
    Build.primitive(void 0),
    [
      Build.apply(
        Build.builtin("Object.defineProperty"),
        Build.primitive(void 0),
        [
          Build.apply(
            Build.builtin("Object.defineProperty"),
            Build.primitive(void 0),
            [
              Build.apply(
                Build.builtin("Object.assign"),
                Build.primitive(void 0),
                [
                  Build.object(
                    Build.primitive("Object.prototype"),
                    []),
                  Scope.parameter("arguments")]),
              Build.primitive("length"),
              Build.object(
                Build.primitive(null),
                [
                  [
                    Build.primitive("value"),
                    Object.get(
                      Scope.arguments(scope),
                      Build.primitive("length"))],
                  [
                    Build.primitive("writable"),
                    Build.primitive(true)],
                  [
                    Build.primitive("configurable"),
                    Build.primitive(true)]])]),
          Build.primitive("callee"),
          Build.object(
            Build.primitive(null),
            (
              Data.get_is_strict(scope) ?
              [
                [
                  Build.primitive("get"),
                  Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get")],
                [
                  Build.primitive("set"),
                  Build.builtin("Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")]] :
              [
                [
                  Build.primitive("value"),
                  Address.get(scope, address)],
                [
                  Build.primitive("writable"),
                  Build.primitive(true)],
                [
                  Build.primitive("configurable"),
                  Build.primitive(true)]]))]),
      Build.builtin("Symbol.iterator"),
      Build.object(
        Build.primitive(null),
        [
          [
            Build.primitive("value"),
            Build.builtin("Array.prototype.values")],
          [
            Build.primitive("writable"),
            Build.primitive(true)],
          [
            Build.primitive("configurable"),
            Build.primitive(true)]])]);
  if (!Data.get_is_strict(scope) && is_simple_parameters && !ArrayLite.includes(identifiers, "arguments")) {
    ArrayLite.forEach(identifiers, (identifier, index) => {
      const base_identiier = Identifier.base(identifier);
      const meta_identifier = Identifier.meta("argmap_" + index + "_" + identifier);
      Data.declare(scope, meta_identifier, null);
      Data.initialize(scope, meta_identifier);
      expressions[meta_identifier] = Build.primitive(true);
      expressions[base_identifier] = Object.get(Build.read(Identifier.PARAMETERS["arguments"], Build.primitive(index)));
    });
    $arguments = new Proxy(..., {
      __proto__: null,
      defineProperty (...Arguments) => {
        let target, key, descriptor, breaking;
        target = Arguments[0];
        key = Arguments[1];
        descriptor = Arguments[2];
        // https://www.ecma-international.org/ecma-262/10.0/index.html#sec-isdatadescriptor
        breaking = ...;
        (
          (key === "0") ?
          (
            argmap_0_ARG0 = breaking ? false : argmap_0,
            (
              armap_0_ARG0 ?
              $ARG0 = descriptor.value :
              void 0)) :
          void 0);
        return Reflect.defineProperty(target, key, descriptor);
      }
    });
    expressions["arguments"] = Build.construct(
      Build.builtin("Proxy"),
      [
        expressions["arguments"],
        Build.object(
          Build.primitive(null),
          [
            [
              Build.primitive("defineProperty"),
              Build.arrow(
                Build.BLOCK(
                  Identifier.base()
  }
  return make_block(scope, identifiers, [], expressions, kontinuation);
};

exports.make_arrow_block = (scope, use_strict, identifiers, kontinuation) => {
  scope = Core.extend(scope, use_strict, true, null);
  Core.declare(scope, Identifiers.parameter("arguments"), null);
  Core.initialize(scope, Identifiers.parameter("arguments"), Build.primitive(null));
  return block(scope, identifiers, [], {__proto__:null}, kontinuation);
};

exports.make_regular_block = (scope, identifiers1, identifiers2, kontinuation) => {
  scope = Core.extend(scope, false, false, null);
  return block(scope, identifiers1, identifiers2, {__proto__:null}, kontinuation);
};

exports.make_dynamic_block = (scope, identifiers1, identifiers2, container, kontinuation) => {
  scope = Core.extend(scope, false, false, container);
  return block(Core.extend(scope, false, false, {__proto__:null}, kontinuation));
};

exports.make_catch_block = (scope, identifiers1, identifiers2, kontinuation) => {
  scope = Core.extend(scope, false, false, null);
  Core.declare(scope, Identifiers.PARAMETERS["error"], PARAMETERS_TAG["error"]);
  Core.initialize(scope, Identifiers.PARAMETERS["error"]);
  return block(scope, identifiers1, identifiers2, EMPTY, kontinuation);
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

exports.make_arrow_block = (scope, use_strict, identifiers1, identifiers2, kontinuation) => {
  scope
};

exports.make_function_block = (scope, use_strict, identifiers1, identifiers2, kontinuation) => {};

exports.make_with_block = (scope, cache, identifiers1, identifiers2, kontinuation) => {};

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

exports.initialize = (scope, identifier, aran_expression) => {
  Split.initialize
  const base_identifier = Identifier.Base(identifier);
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

const on_hit_helper = (kind, {scope, identifier}, {tdz_meta_identifier}, callback) => (
  kind === "initialized" ?
  callback() :
  (
    kind === "static-deadzone" ?
    Build.throw(
      Build.construct(
        Build.builtin("ReferenceError"),
        [
          Build.primitive("Cannot access '" + identifier + "' before initialization")])) :
    (
      kind === "dynamic-deadzone" ?
      Build.conditional(
        Core.lookup(scope, tdz_meta_identifier, TDZ_CALLBACKS, null),
        callback(),
        Build.throw(
          Build.construct(
            Build.builtin("ReferenceError"),
            [
              Build.primitive("Cannot access '" + identifier + "' before initialization")]))) :
      ((() => { throw new global_Error("Unrecognized kind") }) ()))));

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

// const TDZ_CALLBACKS = {
//   __proto__: null,
//   on_miss: (nullable_aran_expression, aran_identifier) => {
//     throw new global_Error("Missing meta TDZ identifier");
//   },
//   on_with: (nullable_aran_expression, aran_identifier, aran_expression, container) => aran_expression,
//   on_hit: (nullable_aran_expression, aran_identifier, kind, tag, access) => {
//     if (kind !== "initialized") {
//       throw new global_Error("Uninitialized TDZ identifier");
//     }
//     if (tag !== TDZ_TAG) {
//       throw new global_Error("Uninitialized TDZ identifier");
//     }
//     return access(nullable_aran_expression);
//   };
// };

const on_deadzone = (context, scope, identifier) => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + identifier + "' before initialization")]));

// Order of operations:
//
// const p = new Proxy(Array.prototype, {
//   proto__: null,
//   has: (tgt, key) => (console.log("has", key), Reflect.has(tgt, key)),
//   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
//   set: (tgt, key, val, rec) => (console.log("set", key), Reflect.set(tgt, key, val, rec)),
//   ownKeys: (tgt) => (console.log("keys"), Reflect.ownKeys(tgt)),
//   getOwnPropertyDescriptor: (tgt, key) => (console.log("getOwnPropertyDescriptor", key), Reflect.getOwnPropertyDescriptor(tgt, key)),
//   getPrototypeOf: (tgt) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(tgt))
// });
// with (p) { flat }
// has flat
// get Symbol(Symbol.unscopables)
// Thrown:
// ReferenceError: flat is not defined
const on_dynamic_helper = (closure) => (context, scope, identifier1, aran_expression, {object:identifier2, unscopables:identifier3}) => Build.conditional(
  Build.conditional(
    Object.has(
      Split.lookup_meta(scope, identifier2, null),
      Build.primitive($identifier)),
    Build.sequence(
      Split.lookup_meta(
        scope,
        identifier3,
        Object.get(
          Split.lookup_meta(scope, identifier2, null),
          Build.builtin("Symbol.unscopables"))),
      Build.conditional(
        Build.conditional(
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Scope.lookup_meta(scope, identifier3, null)),
            Build.primitive("object")),
          Scope.lookup_meta(scope, identifier3, null),
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Scope.lookup_meta(scope, identifier3, null)),
            Build.primitive("function"))),
        Build.unary(
          "!",
          Object.get(
            Scope.lookup_meta(scope, identifier3, null),
            Build.primitive(identifier1))),
        Build.primitive(true))),
    Build.primitive(false)),
  aran_expression,
  closure(scope, identifier1, identifier2));

const typeof_callbacks = {
  __proto__: null,
  on_miss: (context, scope, identifier) => Build.unary(
    "typeof",
    Object.get(
      Build.builtin("global"),
      Build.primitive(identifier))),
  on_initialized: (context, scope, identifier, tag, access) => Build.unary(
    "typeof",
    access(null)),
  on_deadzone: on_deadzone,
  on_dynamic: on_dynamic_helper((scope, identifier1, identifier2) => Build.unary(
    "typeof",
    Object.get(
      Scope.lookup_meta(scope, identifier2, null),
      Build.primitive(identifier1))))};

const read_callbacks = {
  __proto__: null,
  on_miss: (context, scope, identifier) => Build.conditional(
    Object.has(
      Build.builtin("global"),
      Build.primitive(identifier)),
    Object.get(
      Build.builtin("global"),
      Build.primitive(identifier)),
    Build.throw(
      Build.construct(
        Build.builtin("ReferenceError"),
        [
          Build.primitive(identifier + " is not defined")]))),
  on_initialized: (context, scope, identifier, tag, access) => access(null),
  on_deadzone: on_deadzone,
  on_dynamic: on_dynamic_helper((scope, identifier1, identifier2) => Object.get(
    Scope.lookup_meta(scope, identifier2, null),
    Build.primitive(identifier1)))};

const delete_callbacks = {
  __proto__: null,
  on_miss: (context, scope, identifier) => Object.del(
    Core.is_strict(scope), // delete <id> is forbidden in strict mode
    Build.builtin("global"),
    Build.primitive(identifier)),
  on_initialized: (context, scope, identifier, tag, access) => Build.primitive(true),
  on_deadzone: (context, identifier) => Build.primitive(true),
  on_dynamic: on_dynamic_helper((scope, identifier1, identifier2) => Object.del(
    Core.is_strict(scope),
    Scope.lookup_meta(scope, identifier2, null),
    Build.primitive(identifier1)))};

const write_callbacks = {
  __proto__: null,
  on_miss: (scope, identifier1, identifier2) => (
    Scope.is_strict(scope) ?
    Build.conditional(
      Object.has(
        Build.builtin("global"),
        Build.primitive(identifier1)),
      Object.set(
        true,
        Build.builtin("global"),
        Build.primitive(identifier1),
        Split.lookup_meta(scope, identifier2, null)),
      Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive(identifier1 + " is not defined")]))) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(identifier1),
      Split.lookup_meta(scope, identifier2, null))),
  on_deadzone: on_deadzone,
  on_initialized: (scope, identifier, {}) => ()
  on_dynamic: on_dynamic_helper((scope, identifier1, identifier2, identifier3) => Object.set(
    Core.is_strict(scope),
    Scope.lookup_meta(scope, identifier2, null),
    Build.primitive(identifier1),
    Scope.lookup_meta(scope, identifier3, null))};
    
    
};

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
