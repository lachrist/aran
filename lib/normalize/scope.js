
const ArrayLite = require("array-lite");
const Object = require("./object.js");
const Identifier = require("../identifier.js");
const Build = Object.assign({__proto__:null}, require("./build.js"), {
  eval: Build._eval,
  read: Build._read,
  write: Build._write,
  closure: Build._closure,
  BLOCK: Build._BLOCK
});

const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;
const global_Reflect_setPrototypeOf = global.Reflect.setPrototypeOf;
const global_Object_hasOwnProperty = global.Object.hasOwnProperty;
const global_Object_assign = global.Object.assign;
const global_JSON_stringify = global.JSON.stringify;
const global_JSON_parse = global.JSON.parse;
const global_Array_from = global.Array.from;
const global_Error = global.global_Error;

const INITIALIZED = 0;
const WRITABLE = 1;
const DYNAMIC_DEADZONE = 2;

const COMPLETION = "@completion";
const STRICT = "@strict";
const WITH = "@with";
const CLOSURE = "@closure";
const EVALS = "@evals";
const NODES = "@nodes";

const is_identifier = (key) => typeof key === "string" && key[0] !== "@";

const mkcache = (scope, identifier, closure) => {
  identifier = Meta.Identifier(scope, identifier);
  scope[identifier] = global_Array_from({
    __proto__: null,
    [INITIALIZED]: true,
    [WRITABLE]: true,
    [DYNAMIC_DEADZONE]: false
  });
  return closure({__proto__: null, identifier});
};

///////////////
// Non-Build //
///////////////

const mkglobal = (scopes, nodes) => ({
  __proto__: null,
  [WITH]: null,
  [CLOSURE]: null,
  [COMPLETION]: null,
  [STRICT]: false,
  [NODES]: nodes,
  [SCOPES]: scopes
});

exports.$DeleteCompletion = (scope) => ({
  __proto__: scope,
  [COMPLETION]: null
});

exports.$GetCompletion = (scope) => (
  scope[COMPLETION] &&
  {
    __proto__: null,
    identifier: scope[COMPLETION]});

exports.$GetStrict = (scope) => scope[STRICT];

exports.$GetFunctionTag = (scope) => scope[CLOSURE];

exports.$Stringify = (scope) => {
  const frames = [];
  while (global_Reflect_getPrototypeOf(scope)) {
    frames[frames.length] = global_Object_assign({__proto__: null}, scope);
    scope = global_Reflect_getPrototypeOf(scope);
  }
  return global_JSON_stringify(frames);
};

exports.$Parse = (string, nodes, scopes) => {
  const scope = mkglobal(nodes, scopes);
  ArrayLite.forEach(global_JSON_parse(string), (frame) => {
    global_Reflect_setPrototypeOf(frame, scope);
    scope = frame;
  });
  return scope;
};

exports.$Global = mkglobal;

exports.$GetNodes = (scope) => scope[NODES];

exports.$GetScopes = (scope) => scope[SCOPES];

///////////
// Cache //
///////////

exports.cache = (scope, identifier, expression, closure) => mkcache(
  scope,
  identifier,
  (cache) => Build.sequence(
    Build.write(cache.identifier, epxression),
    closure(cache)));

exports.cache = (scope, identifier, any, closure) => (
  (
    typeof any === "object" ?
    any :
    typeof any === "function") ?
  mkcache(
    scope,
    identifier,
    (identifier) => Build.sequence(
      Build.write(identifier, any),
      closure(
        (expression) => (
          expression ?
          Build.write(identifier, expression) :
          Build.read(identifier))))) :
  closure(
    (argument) => (
      argument ?
      (
        (
          () => { throw new global_Error("Cannot assign cached primitives") })
        ()) :
      Build.primitive(any))));

exports.Cache = (scope, identifier, expression, closure) => mkcache(
  scope,
  identifier,
  (cache) => ArrayLite.concat(
    Build.Expression(
      Build.write(cache.identifier, expression)),
    closure(cache)));

exports.get = (scope, cache) => {
  if (cache.identifier in scope) {
    return Build.read(cache.identifier);
  }
  throw new global_Error("Unbound cache");
};

exports.set = (scope, cache, expression) => {
  if (cache.identifier in scope) {
    return Build.write(cache.identifier, expression);
  }
  throw new global_Error("Unbound cache");
};

///////////
// Block //
///////////

const block = (scope, labels, identifiers1, identifiers2, closure) => {
  identifiers1 = ArrayLite.map(identifiers1, Identifier.Base);
  identifiers2 = ArrayLite.map(identifiers2, Identifier.Base);
  ArrayLite.forEach(identifiers1, (identifier) => {
    if (global_Object_hasOwnProperty(scope, identifier)) {
      throw new global_Error("Duplicate declaration");
    }
    scope[identifier] = global_Array_from({
      __proto__: null,
      [INITIALIZED]: false,
      [WRITABLE]: true,
      [DYNAMIC_DEADZONE]: false
    });
  });
  ArrayLite.forEach(identifiers2, (identifier) => {
    if (global_Object_hasOwnProperty(scope, identifier)) {
      throw new global_Error("Duplicate declaration");
    }
    scope[identifier] = global_Array_from({
      __proto__: null,
      [INITIALIZED]: false,
      [WRITABLE]: false,
      [DYNAMIC_DEADZONE]: false
    });
  });
  const statements = closure(scope);
  const identifiers3 = ArrayLite.filter(Object_getOwnPropertyNames(scope), is_identifier);
  return Build.BLOCK(
    labels,
    ArrayLite.concat(
      identifiers3,
      ArrayLite.map(
        ArrayLite.filter(
          identifiers3,
          (identifier) => scope[identifier][DYNAMIC_DEADZONE]),
        (identifier) => Identifier.Meta(null, identifier))),
    Array.concat(
      ArrayLite.flatMap(
        identifiers3,
        (identifier) => (
          scope[identifier][DYNAMIC_DEADZONE] ?
          Build.Expression(
            Build.write(
              Identifier.Meta(null, identifier),
              Build.primitive(false))) :
          [])),
      statements));
};

exports.PROGRAM = (scope, boolean, identifiers1, identifiers2, closure) => (
  (
    (identifier, binding2) => block(
      (
        scope ?
        (
          boolean ?
          {
            __proto__: scope,
            [STRICT]: true,
            [COMPLETION]: identifier,
            [identifier]: binding} :
          {
            __proto__: scope,
            [COMPLETION]: identifier,
            [identifier]: binding}) :
        {
          __proto__: null,
          [STRICT]: boolean,
          [CLOSURE]: false,
          [COMPLETION]: identifier,
          [WITH]: null,
          [identifier]]: binding}),
      [],
      identifiers1,
      identifiers2,
      closure))
  (
    {
      __proto__: null,
      identifier: Identifier.Meta(
        scope || {__proto__: null},
        "ScopeCompletion")},
    global_Array_from(
      {
        __proto__: null,
        [INITIALIZED]: true,
        [WRITABLE]: true,
        [DYNAMIC_DEADZONE]: false})));

exports.BLOCK = (scope, labels, identifiers1, identifiers2, closure) => block(
  {
    __proto__: scope},
  labels,
  identifiers1,
  identifiers2,
  closure);

exports.closure = (scope, boolean1, boolean2, identifiers1, identifiers2, closure) => Build.closure(
  block(
    (
      boolean1 ?
      {
        __proto__: scope,
        [CLOSURE]: boolean2,
        [STRICT]: true} :
      {
        __proto__: scope,
        [CLOSURE]: boolean2}),
    [],
    identifiers1,
    identifiers2,
    closure));

// With keeps the same converted object:
//
// > String.prototype.foo = "foo";
// 'foo'
// > with ("bar") { foo = "qux"; foo; }
// 'qux'
// > with (Object("bar")) { foo = "qux"; foo; }
// 'qux'
// > String.prototype.foo
// 'foo'
//
// Reflect.defineProperty(String.prototype, "foo", {
//   get: function () {
//     this.bar = 123;
//     console.log("get");
//     return "yolo"
//   },
//   set: function (value) {
//     console.log("set", this.bar);
//   }
// });
//
// with ("foo") { foo; foo = 129319; }
// get
// set 123
// 129319
exports.With = (scope, expression, labels, identifiers1, identifiers2, closure) => mkcache(
  scope,
  "ScopeWith",
  (cache) => ArrayLite.concat(
    Build.Expression(
      Build.write(cache.identifier, expression)),
    Build.Expression(
      Build.conditional(
        Build.binary(
          "===",
          Build.read(cache.identifier),
          Build.primitive(null)),
        Build.throw(
          Build.construct(
            Build.builtin("Typeglobal_Error"),
            [
              Build.primitive("Cannot convert 'null' to an object")]))
        Build.primitive(void 0)))
    Build.Expression(
      Build.conditional(
        Build.binary(
          "===",
          Build.read(cache.identifier),
          Build.primitive(void 0)),
        Build.throw(
          Build.construct(
            Build.builtin("Typeglobal_Error"),
            [
              Build.primitive("Cannot convert 'undefined' to an object")]))
        Build.primitive(void 0)))
    Build.Expression(
      Build.write(
        cache.identifier,
        Build.apply(
          Build.builtin("Object"),
          Build.primitive(void 0),
          [
            Build.read(cache.identifier)]))),
    Build.Block(
      block(
        {
          __proto__: scope,
          [WITH]: cache.identifier},
        labels,
        identifiers1,
        identifiers2,
        closure))));

////////////////
// Initialize //
////////////////

exports.initialize = (scope, identifier, expression) => {
  identifier = Identifier.Base(identifier);
  if (!global_Object_hasOwnProperty(scope, identifier)) {
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
        Identifier.Meta(identifier),
        Build.primitive(true)),
      Build.write(identifier, expression)) :
    Build.write(identifier, expression));
};

////////////
// Lookup //
////////////

const base_this = Identifier.Base("this");

const base_new_target = Identifier.Base("new.target");

const lookup = (scope, local, operation) => {
  if (scope === null) {
    if (operation.identifier === base_this || operation.identifier === base_new_target) {
      throw new global_Error("Unbound this / new.target");
    }
    if (operation.tag === "read") {
      return Build.conditional(
        Object.has(
          Build.builtin("global"),
          Build.primitive(operation.identifier)),
        Object.get(
          Build.builtin("global"),
          Build.primitive(operation.identifier)),
        Build.throw(
          Build.construct(
            Build.builtin("Referenceglobal_Error"),
            [
              Build.primitive(operation.identifier + " is not defined")])));
    }
    if (operation.tag === "typeof") {
      return Build.unary(
        "typeof",
        Object.get(
          Build.builtin("global"),
          Build.primitive(operation.identifier)));
    }
    if (operation.tag === "delete") {
      return Object.del(
        false,
        Build.builtin("global"),
        Build.primitive(operation.identifier));
    }
    // Special lookup on global
    // > Reflect.setPrototypeOf(global, new Proxy({__proto__:null}, {
    //   proto__: null,
    //   has: (tgt, key) => (console.log("has", key), Reflect.has(tgt, key)),
    //   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
    //   set: (tgt, key, val, rec) => (console.log("set", key), Reflect.set(tgt, key, val, rec)),
    //   ownKeys: (tgt) => (console.log("keys"), Reflect.ownKeys(tgt)),
    //   getOwnPropertyDescriptor: (tgt, key) => (console.log("getOwnPropertyDescriptor", key), Reflect.getOwnPropertyDescriptor(tgt, key)),
    //   getPrototypeOf: (tgt) => (console.log("getPrototypeOf"), Reflect.getPrototypeOf(tgt))
    // }));
    // > function f () { "use strict"; foo = 123 }
    // > f()
    // set foo
    if (operation.tag === "write") {
      return (
        operation.scope[STRICT] ?
        (
          (
            (closure) => (
              typeof operation.either === "function" ?
              closure(operation.either) :
              // Even if Reflect.has is not performed normally, we evaluate
              // the right-hand side before which seems more in accord to the
              // evaluation order of assignments.
              mkcache(
                operation.scope,
                "ScopeGlobalRight",
                (cache) => Build.sequence(
                  Build.write(cache.identifier, operation.expression),
                  closure(
                    () => Build.read(cache.identifier))))))
          (
            (closure) => Build.conditional(
              Object.has(
                Build.builtin("global"),
                Build.primitive(operation.identifier)),
              Object.set(
                true,
                Build.builtin("global"),
                Build.primitive(operation.identifier),
                closure()),
              Build.throw(
                Build.construct(
                  Build.builtin("Referenceglobal_Error"),
                  [
                    Build.primitive(operation.identifier + " is not defined")]))))) :
        Object.set(
          false,
          Build.builtin("global"),
          Build.primitive(operation.identifier),
          (
            operation.expression ||
            Build.read(operation.cache.identifier))));
    }
    throw new global_Error("Invalid operation tag");
  }
  if (global_Object_hasOwnProperty(scope, identifier)) {
    if (operation.tag === "delete") {
      return Build.primitive(false);
    }
    const closure = (closure1) => {
      const closure2 = () => Build.throw(
        Build.construct(
          Build.builtin("Referenceglobal_Error"),
          [
            Build.primitive("Cannot access '" + identifier + "' before initalization")]));
      if (scope[identifier][INITIALIZED]) {
        return closure1();
      }
      if (local) {
        return closure2();
      }
      scope[identifier][DYNAMIC_DEADZONE] = true;
      return Build.conditional(
        Build.read(
          Identifier.Meta(operation.identifier)),
        closure1(),
        closure2());
    };
    if (operation.tag === "typeof") {
      return closure(
        () => Build.unary(
          "typeof",
          Build.read(operation.identifier)));
    }
    if (operation.tag === "read") {
      return closure(
        () => Build.read(operation.identifier));
    }
    if (operation.tag === "write") {
      return closure(
        () => (
          scope[identifier][WRITABLE] ?
          Build.write(
            operation.identifier,
            (
              typeof operation.either === "function" ?
              either() :
              either)) :
          Build.throw(
            Build.construct(
              Build.builtin("Typeglobal_Error"),
              [
                Build.primitive("Assignment to a constant variable")]))));
    }
    throw new global_Error("Invalid operation tag");
  }
  local = local && !global_Object_hasOwnProperty(scope, CLOSURE);
  if (global_Object_hasOwnProperty(scope, "with") && operation.identifier !== base_this && operation.identifier !== base_new_target) {
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
    const closure = (closure1, closure2) => Build.conditional(
      Build.conditional(
        Object.has(
          Build.read(scope[WITH]),
          Build.primitive(operation.identifier)),
        mkcache(
          scope,
          "ScopeWithUnscopables",
          (cache) => Build.sequence(
            Build.write(
              cache.identifier,
              Object.get(
                Build.read(scope[WITH]),
                Build.builtin("Symbol.unscopables"))),
            Build.conditional(
              Build.conditional(
                Build.binary(
                  "===",
                  Build.unary(
                    "typeof",
                    Build.read(cache.identifier)),
                  Build.primitive("object")),
                Build.read(cache.identifier),
                Build.binary(
                  "===",
                  Build.unary(
                    "typeof",
                    Build.read(cache.identifier)),
                  Build.primitive("function"))),
              Build.unary(
                "!",
                Object.get(
                  Build.read(cache.identifier),
                  Build.primitive(operation.identifier))),
              Build.primitive(true)))),
        Build.primitive(false)),
      closure1(),
      (
        closure2 ?
        closure2() :
        lookup(
          global_Reflect_getPrototypeOf(scope),
          local,
          operation)));
    }
    if (operation.tag === "delete") {
      return closure(
        () => Object.del(
          Build.read(scope[WITH]),
          Build.primitive(operation.identifier)));
    }
    if (operation.tag === "typeof") {
      return closure(
        () => Build.unary(
          "typeof",
          Object.get(
            Build.read(scope[WITH]),
            Build.primitive(operation.identifier))));
    }
    if (operation.tag === "read") {
      return closure(
        () => Object.get(
          Build.read(scope[WITH]),
          Build.primitive(operation.identifier)));
    }
    if (operation.tag === "write") {
      return (
        (
          (closure) => (
            typeof operation.either === "function" ?
            closure(operation.either) :
            mkcache(
              operation.scope,
              "ScopeWithRight",
              either,
              (cache) => Build.sequence(
                Build.write(cache.identifier, operation.expression),
                closure(
                 () => Build.read(cache.identifier))))))
        (
          (closure) => closure(
            () => Object.set(
              operation.scope[STRICT],
              Build.read(scope[WITH]),
              Build.primitive(operation.identifier),  
              closure()),
            () => lookup(
              global_Reflect_getPrototypeOf(scope),
              local
              {
                __proto__: null,
                tag: "write",
                scope: operation.scope,
                identifier: operation.identifer,
                either: closure}))));
    }
    throw new global_Error("Unknown tag");
  }
  return lookup(global_Reflect_getPrototypeOf(scope), local, operation);
}

exports.write = (scope, identifier, either) => lookup(scope, true, {
  __proto__: null,
  tag: "write",
  scope,
  identifier: Identifier.Base(identifier),
  either
});

ArrayLite.forEach(["read", "typeof", "delete"], (tag) => {
  exports[tag] = (scope, identifier) => lookup(scope, true, {
    __proto__: null,
    tag,
    scope,
    identifier: Identifier.Base(identifier)
  });
});

//////////
// Eval //
//////////

exports.eval = (scope, expression) => {
  for (const key in scope) {
    if (is_identifier(key) && !scope[key][INITIALIZED]) {
      let frame = scope;
      while (frame) {
        if (Object_hasOwnproperty(frame, key)) {
          break;
        }
        if (global_Object_hasOwnProperty(frame, CLOSURE)) {
          scope[key][DYNAMIC_DEADZONE] = true;
          break;
        }
        frame = global_Reflect_getPrototypeOf(frame);
      }
    }
  }
  return Build.eval(expression);
};

//////////////////
// Undeclarable //
//////////////////

ArrayLite.forEach(["callee", "new.target", "arguments", "error"], (identifier) => {
  exports[identifier] = Build.read(identifier);
});
