
const ArrayLite = require("array-lite");
const Object = require("./object.js");
const Identifier = require("../identifier.js");
const Build = global.Object.assign({__proto__:null}, require("./build.js"));
Build.eval = Build._eval;
Build._read = Build._read;
Build.write = Build._write;
Build.BLOCK = Build._BLOCK;

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

const COMPLETION = global_Symbol("@completion");
const CONTINUE_LABELS = global_Symbol("@continue-labels");
const STRICT = "@strict";
const WITH = "@with";
const CLOSURE = "@closure";

const isid = (key) => typeof key === "string" && key[0] !== "@";

const hide = (scope, identifier) => {
  identifier = Meta.Identifier(scope, identifier);
  scope[identifier] = global_Array_from({
    __proto__: null,
    [INITIALIZED]: true,
    [WRITABLE]: true,
    [DYNAMIC_DEADZONE]: false
  });
  return identifier;
};

///////////////
// Non-Build //
///////////////

exports.$DeleteCompletion = (scope) => (
  scope[COMPLETION] === null ?
  scope :
  {
  __proto__: scope,
  [COMPLETION]: null});

exports.$GetCompletion = (scope) => (
  scope[COMPLETION] &&
  {
    __proto__: null,
    identifier: scope[COMPLETION]});

exports.$GetStrict = (scope) => scope[STRICT];

exports.$GetClosure = (scope) => scope[CLOSURE];

exports.$Stringify = (scope) => {
  const frames = [];
  while (scope) {
    frames[frames.length] = global_Object_assign({__proto__: null}, scope);
    scope = global_Reflect_getPrototypeOf(scope);
  }
  return global_JSON_stringify(frames);
};

exports.$Parse = (string) => {
  const scope = null;
  const frames = global_JSON_parse(string);
  for (let index = 0; index < frames.length; index++) {
    global_Reflect_setPrototypeOf(frames[index], scope);
    scope = frames[index];
  }
  return scope;
};

exports.$Cache = (scope, primitive) => ({
  __proto__: null,
  primitive: primitive
});

exports.$Error = (scope) => ({
  __proto__: null,
  identifier: "error"
});

///////////
// Cache //
///////////

const mkcache = (scope, identifier, any, closure1, closure2) => {
  if (typeof any === "function") {
    throw new global_Error("Cache values cannot be a functions");
  }
  if (typeof any === "symbol") {
    throw new global_Error("Cache values cannot be symbols");
  }
  if (typeof any === "object" && any !== null) {
    identifier = hide(scope, identifier);
    return closure2({__proto__: null, identifier: identifier}, Build.write(identifier, any));
  }
  closure1({__proto__: null, primitive: any});
}

exports.get = (scope, cache) => (
  "identifier" in cache ?
  Build.read(cache.identifier) :
  Build.primitive(cache.primitive));

exports.set = (scope, cache, expression) => (
  "identifier" in cache ?
  Build.write(cache.identifier, expression) :
  (
    (
      () => { throw new Error("Cannot assign cached primitives") })
    ()));

exports.cache = (scope, identifier, value, closure) => mkcache(
  scope,
  identifier,
  value,
  closure,
  (cache, expression) => Build.sequence(
    expression,
    closure(cache)));

exports.Cache = (scope, identifie, value, closure) => mkcache(
  scope,
  identifier,
  value,
  closure,
  (cache, expression) => ArrayLite.concat(
    Build.Expression(expression),
    closure(cache)));

///////////
// Block //
///////////

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
exports.BLOCK = (scope, options, identifiers1, identifier2, closure) => {
  options = options || {__proto__:null};
  if (scope === null) {
    scope = {
      __proto__: null,
      [STRICT]: false,
      [COMPLETION]: null,
      [CLOSURE]: null,
      [WITH]: null
    };
  } else {
    scope = {
      __proto__: scope
    };
  }
  if ("closure" in options) {
    scope[CLOSURE] = options.closure;
  }
  if ("strict" in options) {
    options[STRICT] = options.strict;
  }
  let statements1 = [];
  if ("completion" in options) {
    const identifier = hide(scope, "ScopeBlockCompletion");
    scope[COMPLETION] = identifier;
    statements1 = ArrayLite.concat(statements1, Build.Expression(Build.write(identifier, Build.primitive(void 0))));
  }
  if ("with" in options) {
    scope[WITH] = hide(scope, "ScopeBlockWith");
    statements1 = ArrayLite.concat(
      statements1,
      Build.Expression(
        Build.write(
          scope[WITH],
          Object.convert(
            () => (
              "identifier" in options.with ?
              Build.read(options.with.identifier) :
              Build.primitive(options.with.primitive))))));
  }
  ArrayLite.forEach([true, false], (boolean) => {
    ArrayLite.forEach(boolean ? identifiers1 : identifiers2, (identifier) => {
      identifier = Identifier.Base(identifier);
      if (global_Object_hasOwnProperty(scope, identifier)) {
        throw new global_Error("Duplicate declaration");
      }
      Reflect_defineProperty(scope, identifier, {
        __proto__: null,
        writable: true,
        enumerable: true,
        configurable: true,
        value: global_Array_from({
          __proto__: null,
          [INITIALIZED]: false,
          [WRITABLE]: boolean,
          [DYNAMIC_DEADZONE]: false
        })
      });
    });
  });
  const statements2 = closure(scope);
  const identifiers3 = ArrayLite.filter(Object_getOwnPropertyNames(scope), isid);
  return Build.BLOCK(
    (
      "labels" in options ?
      options.labels :
      []),
    ArrayLite.concat(
      identifiers3,
      ArrayLite.map(
        ArrayLite.filter(
          identifiers3,
          (identifier) => scope[identifier][DYNAMIC_DEADZONE]),
        (identifier) => Identifier.Meta(null, identifier))),
    Array.concat(
      ArrayLite.flatMap(
        ArrayLite.filter(
          identifiers3,
          (identifier) => scope[identifier][DYNAMIC_DEADZONE]),
        (identifier) => Build.Expression(
          Build.write(
            Identifier.Meta(null, identifier),
            Build.primitive(false)))),
      statements1,
      statements2));
};

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

const lookup = (scope, boolean, object) => {
  if (scope === null) {
    if (object.identifier === base_this || object.identifier === base_new_target) {
      throw new global_Error("Unbound this / new.target");
    }
    if (object.tag === "read") {
      return Build.conditional(
        Object.has(
          Build.builtin("global"),
          Build.primitive(object.identifier)),
        Object.get(
          Build.builtin("global"),
          Build.primitive(object.identifier)),
        Build.throw(
          Build.construct(
            Build.builtin("ReferenceError"),
            [
              Build.primitive(object.identifier + " is not defined")])));
    }
    if (object.tag === "typeof") {
      return Build.unary(
        "typeof",
        Object.get(
          Build.builtin("global"),
          Build.primitive(object.identifier)));
    }
    if (object.tag === "delete") {
      return Object.del(
        false, // delete <id> is forbidden in strict mode
        Build.builtin("global"),
        Build.primitive(object.identifier));
    }
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
    if (object.tag === "write") {
      return (
        object.scope[STRICT] ?
        // Even if Reflect.has is not normally performed (i.e.
        // transparency breakage, we evaluate the right-hand side first
        // which seems more consistent to the normal evaluation order of
        // assignments.
        (
          (
            (identifier) => Build.sequence(
              Build.write(identifier, object.expression),
              Build.conditional(
                Object.has(
                  Build.builtin("global"),
                  Build.primitive(object.identifier)),
                Object.set(
                  true,
                  Build.builtin("global"),
                  Build.primitive(object.identifier),
                  (
                    "identifier" in cache ?
                    Build.read(cache.identifier) :
                    Build.primitive(cache.primitive)),
                Build.throw(
                  Build.construct(
                    Build.builtin("ReferenceError"),
                    [
                      Build.primitive(object.identifier + " is not defined")]))))))
        (
          (hide(scope, "ScopeLookupGlobalRight")))) :
        Object.set(
          false,
          Build.builtin("global"),
          Build.primitive(object.identifier),
          object.expression));
    }
    throw new global_Error("Invalid operation tag");
  }
  if (global_Object_hasOwnProperty(scope, identifier)) {
    if (object.tag === "delete") {
      return Build.primitive(false);
    }
    const closure = (closure1) => {
      const closure2 = () => Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive("Cannot access '" + identifier + "' before initalization")]));
      if (scope[identifier][INITIALIZED]) {
        return closure1();
      }
      if (boolean) {
        return closure2();
      }
      scope[identifier][DYNAMIC_DEADZONE] = true;
      return Build.conditional(
        Build.read(
          Identifier.Meta(object.identifier)),
        closure1(),
        closure2());
    };
    if (object.tag === "typeof") {
      return closure(
        () => Build.unary(
          "typeof",
          Build.read(object.identifier)));
    }
    if (object.tag === "read") {
      return closure(
        () => Build.read(object.identifier));
    }
    if (object.tag === "write") {
      return closure(
        () => (
          scope[identifier][WRITABLE] ?
          Build.write(
            object.identifier,
            object.expression) :
          Build.throw(
            Build.construct(
              Build.builtin("TypeError"),
              [
                Build.primitive("Assignment to a constant variable")]))));
    }
    throw new global_Error("Invalid operation tag");
  }
  boolean = boolean && !global_Object_hasOwnProperty(scope, CLOSURE);
  if (
    global_Object_hasOwnProperty(scope, WITH) &&
    object.identifier !== base_this &&
    object.identifier !== base_new_target) {
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
          Build.primitive(object.identifier)),
        (
          (
            (identifier) => Build.sequence(
              Build.write(
                identifier,
                Object.get(
                  Build.read(scope[WITH]),
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
                    Build.primitive(identifier))),
                Build.primitive(true))))
          (
            hide(scope, "ScopeLookupUnscopables"))),
        Build.primitive(false)),
      closure1(),
      closure2());
    if (object.tag === "delete") {
      return closure(
        () => Object.del(
          Build.read(scope[WITH]),
          Build.primitive(object.identifier)),
        () => lookup(
          global_Reflect_getPrototypeOf(scope),
          boolean,
          object));
    }
    if (object.tag === "typeof") {
      return closure(
        () => Build.unary(
          "typeof",
          Object.get(
            Build.read(scope[WITH]),
            Build.primitive(object.identifier))),
        () => lookup(
          global_Reflect_getPrototypeOf(scope),
          boolean,
          object));
    }
    if (object.tag === "read") {
      return closure(
        () => Object.get(
          Build.read(scope[WITH]),
          Build.primitive(object.identifier)),
        () => lookup(
          global_Reflect_getPrototypeOf(scope),
          boolean,
          object));
    }
    if (object.tag === "write") {
      return (
        (
          (identifier) => Build.sequence(
            Build.write(identifier, object.expression),
            closure(
              () => Object.set(
                object.scope[STRICT],
                Build.read(scope[WITH]),
                Build.primitive(object.identifier),  
                Build.read(identifier)),
              () => lookup(
                global_Reflect_getPrototypeOf(scope),
                boolean,
                {
                  __proto__: null,
                  tag: "write",
                  scope: object.scope,
                  identifier: object.identifer,
                  expression: Build.read(cache.identifier)}))))
        (
          hide(scope, "ScopeLookupWithRight")));
    }
    throw new global_Error("Unknown tag");
  }
  return lookup(global_Reflect_getPrototypeOf(scope), boolean, object);
};

exports.write = (scope, identifier, expression) => lookup(scope, true, {
  __proto__: null,
  tag: "write",
  scope: scope,
  identifier: Identifier.Base(identifier),
  expression: expression
});

ArrayLite.forEach(["read", "typeof", "delete"], (tag) => {
  exports[tag] = (scope, identifier) => lookup(scope, true, {
    __proto__: null,
    tag: tag,
    scope: scope,
    identifier: Identifier.Base(identifier)
  });
});

//////////
// Eval //
//////////

exports.eval = (scope, expression) => {
  for (const key in scope) {
    if (isid(key) && !scope[key][INITIALIZED]) {
      let frame = scope;
      while (frame) {
        if (globla_Object_hasOwnproperty(frame, key)) {
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

///////////////////
// Undeclarables //
///////////////////

exports.callee = (scope) => Build.read("callee");

exports.newtarget = (scope) => Build.read("new.target");

exports.arguments = (scope) => Build.read("arguments");

exports.error = (scope) => Build.read("error");
