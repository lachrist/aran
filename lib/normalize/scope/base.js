"use strict";

// We could make parameters optional but that would require recursive identifier elimination which we do not support atm.
// e.g.: Constructing `$arguments` requires performing lookups on `args`.
//       If `args` is not otherwise used, removing `$arguments` enables removing `args` as well.
//       `function () { return "foo" }``
//       `function (...args) => { $arguments = ...; return "foo" }`

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

const REGULAR_TAGS = {
  __proto__: null,
  true: {
    __proto__: null,
    type: "regular",
    writable: true,
    argmap: null
  },
  false: {
    __proto__: null,
    type: "regular",
    writable: false,
    argmap: null
  }
};

const make_block = (identifiers1, identifiers2, kontinuation) => (scope) => {
  for (let writable = true; writable !== null; writable = writable ? false : null) {
    const identifiers = writable ? identifiers1 : identifiers2;
    for (let index = 0; index < identifiers.length; index++) {
      Split.declare_base(scope, identifiers[index], REGULAR_TAGS[writable]);
    }
  }
  return kontinuation(scope);
};

//   const aran_statements = kontinuation(scope);
//   return Split.build_block(scope, (kind, identifier, initialized, lookedup, tag) => {
//     if (lookedup) {
//       return true;
//     }
//     for (let index = 0; index < optionals.length; index++) {
//       if (kind === optionals[index].kind && identifier === optionals[index].identifier) {
//         while (index < optionals.length - 1) {
//           optionals[index] = optionals[index+1];
//           index++;
//         }
//         optionals.length--;
//         return false;
//       }
//     }
//     return true;
//   }, () => ArrayLite.concat(ArrayLite.map(optionals, ({statement}) => statement), aran_statements));
// };

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

exports.make_function_block = (scope, use_strict, nullable_identifier, container, is_simple, identifiers, kontinuation) => {
  scope = Split.extend(scope, use_strict, true, null);
  const optionals = [];
  // callee //
  if (nullable_identifier !== null && !ArrayLite.includes(identifiers, nullable_identifier)) {
    optionals[optionals.length] = {
      __proto__: null,
      kind: "base",
      identifier: nullable_identifier,
      statement: Build.Expression(
        Split.declare_initialize_base(
          scope,
          nullable_identifier,
          REGULAR_TAGS[true],
          Container.get(scope, container)))};
  }
  // new.target //
  Split.declare_initialize_para(scope, "new.target");
  optionals[optionals.length] = {
    __proto__: null,
    kind: "base",
    identifier: "new.target",
    statement: Build.Expression(
      Split.declare_initialize_base(
        scope,
        nullable_identifier,
        REGULAR_TAGS[false],
        Split.lookup_para(scope, "new.target", null))};
  // this //
  Split.declare_initialize_para(scope, "this");
  optionals[optionals.length] = {
    __proto__: null,
    kind: "base",
    identifier: "this",
    statement: Build.Expression(
      Split.declare_initialize_base(
        scope,
        nullable_identifier,
        REGULAR_TAGS[false],
        Build.conditional(
          Split.lookup_para(scope, "new.target", null),
          Build.object(
            Object.get(
              Split.lookup_para(scope, "new.target", null),
              Build.primitive("prototype")),
            []),
          (
            Split.is_strict(scope) ?
            Split.lookup_para(scope, "this", null) :
            Build.conditional(
              Build.binary(
                "===",
                Split.lookup_para(scope, "this", null),
                Build.primitive(null)),
              Build.builtin("global"),
              Build.conditional(
                Build.binary(
                  "===",
                  Split.lookup_para(scope, "this", null),
                  Build.primitive(void 0)),
                Build.builtin("global"),
                Build.apply(
                  Build.builtin("Object"),
                  Build.primitive(void 0),
                  [
                    Split.lookup_para(scope, "this", null)])))))))};
  // arguments //
  Split.declare_initialize_para(scope, "arguments");
  if (!ArrayLite.includes(identifiers, "arguments") {
    const aran_expression = Build.apply(
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
                    Split.lookup_para(scope, "arguments", null)]),
                Build.primitive("length"),
                Build.object(
                  Build.primitive(null),
                  [
                    [
                      Build.primitive("value"),
                      Object.get(
                        Split.lookup_para(scope, "arguments", null),
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
                Split.is_strict(scope) ?
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
                    Container.get(scope, container)],
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
    if (Split.is_strict(scope) || !is_simple) {
      optionals[optionals.length] = {
        __proto__: null,
        kind: "base",
        identifier: "arguments",
        statement: Build.Expression(
          Split.declare_initialize_base(
            scope,
            nullable_identifier,
            REGULAR_TAGS[false],
            aran_expression)};
    } else {
      for (let index = 0; index < identifiers.length; index++) {
        const {identifier, aran_expression} = Split.declare_initialize_meta(scope, "argmap" + index, Build.primitive(true));
        aran_expressionss.meta[identifier] = aran_expression;
        aran_expressionss.base[identifier] = Split.declare_initialize_base(scope, identifiers[index], Object.get(
          Split.lookup_para(scope, "arguments", null),
          Build.primitive(index)));
      }
      $arguments = new Proxy(..., {
        __proto__: null,
        defineProperty (...args) => {
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
      identifiers = [];
    }
  }
  return make_block(scope, identifiers, [], [], kontinuation);
};
    
  if (!Data.get_is_strict(scope) && is_simple_parameters && !ArrayLite.includes(identifiers, "arguments")) {
    ArrayLite.forEach(identifiers, (identifier, index) => {
      const base_identiier = Identifier.base(identifier);
      const meta_identifier = Identifier.meta("argmap_" + index + "_" + identifier);
      Data.declare(scope, meta_identifier, null);
      Data.initialize(scope, meta_identifier);
      expressions[meta_identifier] = Build.primitive(true);
      expressions[base_identifier] = Object.get(Build.read(Identifier.PARAMETERS["arguments"], Build.primitive(index)));
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

exports.extend_closure = (scope, is_use_strict, identifiers, kontinuation) => {
  return Layer.extend_closure(scope, is_use_strict, (scope) => {
    for (let index = 0; index < identifiers.length; index++) {
      Layer.declare_base(scope, identifiers[index], true);
    }
    return kontinuation(scope);
  });
};

exports.extend_argmap_closure = (scope, is_use_strict, identifiers, identifiers, kontinuation) => {
  return Layer.extend_closure(scope, is_use_strict, (scope) => {
    if (nullable_identifier !== null) {
      Layer.declare_base(scope, identifiers[index], true);
    }
    for (let index = 0; index < identifiers.length; index++) {
      Layer.declare_base(scope, identifiers[index], index);
    }
    return kontinuation(scope);
  });
};

exports.extend_eval = (frame_array, is_use_strict, identifiers1, identifiers2, kontinuation) => {
  
};

exports.extend_global = (is_use_strict, identifiers, kontinuation) => {
  
};

exports.make_block = (scope, identifiers1, identifiers2, nullable_container, kontinuation) => {
  
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

exports.initialize = Layer.initialize_base;

// exports.initialize = (scope, identifier, aran_expression) => 
//   Layer.initialize_base(scope, identifier, aran_expression);
//   Split.initialize
//   const base_identifier = Identifier.Base(identifier);
//   if (!(identifier in scope)) {
//     throw new global_Error("Distant initialization");
//   }
//   if (scope[identifier][INITIALIZED]) {
//     throw new global_Error("Duplicate initialization");
//   }
//   scope[identifier][INITIALIZED] = true;
//   return (
//     scope[identifier][DYNAMIC_DEADZONE] ?
//     Build.sequence(
//       Build.write(
//         tdz($identifier),
//         Build.primitive(true)),
//       Build.write(identifier, expression)) :
//     Build.write(identifier, expression));
// };

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

const read_callbacks = {
  on_deadzone: ({scope, identifier}) => deadzone(identifier),
  on_miss: ({scope, identifier}) => 
  on_hit: ({scope, identifier}, writable, access) => 
};

const deadzone = (identifier} => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + identifier + "' before initialization")]));

const on_initialized = ({nullable_aran_expression, scope, identifier}, writable, access) => 


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

const on_deadzone = (context, writable) => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + context.identifier + "' before initialization")]));

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


// data Context = {
//   scope :: Scope,
//   identifier :: Identifier
// }

// data OptimisticWriteContext = {
//   scope :: Scope,
//   identifier :: Identifier,
//   right :: AranExpression 
// }

// data PessimisticWriteContext = {
//   scope :: Scope,
//   identifier :: Identifier,
//   right :: MetaIdentifier
// }

const EMPTY = {};

const special_callbacks_prototype = {
  on_miss: (empty) => { throw new global_Error("Missing this or new.target") },
  on_deadzone: (empty, writable) => { throw new global_Error("Dynamic deadzone for this or new.target") },
  on_dynamic: (empty, aran_expression, dynamic) => aran_expression};

const special_callbacks = {
  typeof: {
    __proto__: special_callbacks_prototype,
    on_initialized: (empty, writable, access) => Build.unary(
      "typeof",
      access(null))},
  read: {
    __proto__: special_callbacks_prototype,
    on_initialized: (empty, writable, access) => access(null)},
  delete: {
    __proto__: special_callbacks_prototype,
    on_initialized: (empty, writable, acccess) => Build.primitive(true)}};

// MakeAranExpression :: (Context, MetaIdentifier) -> AranExpression
const make_on_dynamic = (make_aran_expression) => (context, aran_expression, dynamic) => Build.conditional(
  Build.conditional(
    Object.has(
      Layer.lookup_meta(context.scope, dynamic.object, null),
      Build.primitive(context.identifier)),
    Build.sequence(
      Layer.lookup_meta(
        context.scope,
        dynamic.unscopables,
        Object.get(
          Layer.lookup_meta(context.scope, dynamic.object, null),
          Build.builtin("Symbol.unscopables"))),
      Build.conditional(
        Build.conditional(
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Layer.lookup_meta(context.scope, dynamic.unscopables, null)),
            Build.primitive("object")),
          Layer.lookup_meta(context.scope, dynamic.unscopables, null),
          Build.binary(
            "===",
            Build.unary(
              "typeof",
              Layer.lookup_meta(context.scope, dynamic.unscopables, null)),
            Build.primitive("function"))),
        Build.unary(
          "!",
          Object.get(
            Layer.lookup_meta(context.scope, dynamic.unscopables, null),
            Build.primitive(context.identifier))),
        Build.primitive(true))),
    Build.primitive(false)),
  aran_expression,
  make_aran_expression(context, dynamic.object));

const on_deadzone = (context) => Build.throw(
  Build.construct(
    Build.builtin("ReferenceError"),
    [
      Build.primitive("Cannot access '" + context.identifier + "' before initialization")]));

const regular_callbacks = {
  typeof: {
    on_deadzone,
    on_miss: (context) => Build.unary(
      "typeof",
      Object.get(
        Build.builtin("global"),
        Build.primitive(context.identifier))),
    on_hit: (context, writable, access) => Build.unary(
      "typeof",
      access(null)),
    on_dynamic: make_on_dynamic(
      (context, meta_identifier) => Build.unary(
        "typeof",
        Object.get(
          Layer.lookup_meta(context.scope, meta_identifier, null),
          Build.primitive(context.identifier))))},
  read: {
    on_deadzone,
    on_miss: (context) => Build.conditional(
      Object.has(
        Build.builtin("global"),
        Build.primitive(context.identifier)),
      Object.get(
        Build.builtin("global"),
        Build.primitive(context.identifier)),
      Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive(context.identifier + " is not defined")]))),
    on_initialized: (context, writable, access) => access(null),
    on_dynamic: make_on_dynamic(
      (context, meta_identifier) => Object.get(
        Layer.lookup_meta(context.scope, meta_identifier, null),
        Build.primitive(context.identifier)))},
  delete: {
    on_deadzone: (context) => Build.primitive(true),
    on_miss: (context) => Object.del(
      false, // console.assert(Layer.is_strict(scope) === false) // delete <id> is forbidden in strict mode
      Layer.lookup_meta(context.scope, dynamic.object, null),
      Build.primitive(context.identifier)),
    on_initialized: (context) => Build.primitive(true),
    on_dynamic: make_on_dynamic(
      (context, meta_identifier) => Object.del(
        false, // console.assert(Layer.is_strict(scope) === false) // delete <id> is forbidden in strict mode
        Layer.lookup_meta(context.scope, meta_identifier, null),
        Build.primitive(context.identifier)))}};

ArrayLite.forEach(["typeof", "read", "delete"], (kind) => {
  exports[kind + "_this"] = (scope) => Layer.lookup_base(scope, "this", special_callbacks[kind], EMPTY);
  exports[kind + "_newtarget"] = (scope) => Layer.lookup_base(scope, "new.target", special_callbacks[kind], EMPTY);
  exports[kind] = (scope, identifier) => Layer.lookup_base(scope, identifier, regular_callbacks[kind], {scope, identifier})
});

const MARKER = {};

const optimistic_write_regular_callbacks = {
  on_miss: (optimistic_write_context) => { throw MARKER },
  on_initialized: (optimistic_write_context, writable, access) => (
    writable ?
    access(optimistic_write_context.right) :
    Build.sequence(
      optimistic_write_context.right,
      Build.throw(
        Build.construct(
          Build.builtin("TypeError"),
          [
            Build.primitive("Assignment to constant variable.")])))),
  on_deadzone: (optimistic_write_context, writable) => Build.sequence(
    optimistic_write_context.right,
    on_deadzone(optimistic_write_context)),
  on_dynamic: (optimistic_write_context, aran_expression, dynamic) => { throw MARKER }}; // It is  safe to drop the aran_expression because it has no side effect (on the scope)

const pessimistic_write_regular_callbacks = {
  on_miss: (pessimistic_write_context) => (
    Layer.is_strict(pessimistic_write_context.scope) ?
    Build.conditional(
      Object.has(
        Build.builtin("global"),
        Build.primitive(pessimistic_write_context.identifier)),
      Object.set(
        true,
        Build.builtin("global"),
        Build.primitive(pessimistic_write_context.identifier),
        Split.lookup_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null)),
      Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive(pessimistic_write_context.identifier + " is not defined")]))) :
    Object.set(
      false,
      Build.builtin("global"),
      Build.primitive(pessimistic_write_context.identifier),
      Split.lookup_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null))),
  on_initialized: (pessimistic_write_context, writable, access) => (
    writable ?
    access(
      Layer.lookup_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null)) :
    Build.throw(
      Build.construct(
        Build.builtin("TypeError"),
        [
          Build.primitive("Assignment to constant variable.")]))),
  on_deadzone,
  on_dynamic: make_on_dynamic(
    (pessimistic_write_context, meta_identifier) => Object.set(
      Layer.is_strict(pessimistic_write_context.scope),
      Layer.lookup_meta(pessimistic_write_context.scope, meta_identifier, null),
      Build.primitive(pessimistic_write_context.identifier),
      Scope.lookup_meta(pessimistic_write_context.scope, pessimistic_write_context.right, null)))};

exports.write = (scope, identifier, aran_expression) => {
  try {
    return Layer.lookup_base(scope, identifier, optimistic_write_regular_callbacks, {scope, identifier, right:aran_expression});
  } catch (error) {
    if (error !== MARKER) {
      throw error;
    }
    const meta_identifier = Layer.declare_meta(scope, identifier);
    return Build.sequence(
      Layer.declare_initialize(scope, meta_identifier),
      Layer.lookup_base(scope, identifier, pessimistic_write_regular_callbacks, {scope, identifier, right:meta_identifier}));
  }
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
