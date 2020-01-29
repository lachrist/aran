
const ArrayLite = require("array-lite");
const Object = require("./object.js");
const Identifier = require("../identifier.js");
const Global = require("./global.js");
const Build = global.Object.assign({__proto__:null}, require("./build.js"));
Build.eval = Build._eval;
Build.read = Build._read;
Build.write = Build._write;
Build.BLOCK = Build._BLOCK;

const global_Reflect_ownKeys = global.Reflect.ownKeys;
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

const STRICT = "@strict";
const WITH = "@with";
const CLOSURE = "@closure";

const hide = (scope, identifier) => {
  if (identifier === "TDZ") {
    throw new global_Error("Cannot hide TDZ-prefixed identifiers");
  }
  const index = 0;
  while ((identifier + index) in scope) {
    index++;
  }
  const meta = Identifier.Meta(identifier + index);
  scope[meta] = null;
  return meta;
};

///////////////
// Non-Build //
///////////////

exports.$ExtendWith = (scope, cache) => ({
  __proto__: scope,
  [WITH]: cache
});

exports.$ExtendStrict = (scope) => ({
  __proto__: scope,
  [STRICT]: true
});

exports.$ExtendArrow = (scope) => ({
  __proto__: scope,
  [CLOSURE]: "arrow"
});

exports.$ExtendFunction = (scope) => ({
  __proto__: scope,
  [CLOSURE]: "function"
});

exports.$IsStrict = (scope) => scope[STRICT];

exports.$IsGobal = (scope) => {
  while (global_Object_hasOwnProperty(scope, STRICT)) {
    scope = global_Reflect_getPrototypeOf(scope);
    if (scope === null) {
      return true;
    }
  }
  return false;
};

exports.$IsFunction = (scope) => scope[CLOSURE] === "function";

exports.$Create = (serial) => {
  if (serial === null) {
    return {
      __proto__: null,
      [STRICT]: false,
      [CLOSURE]: null,
      [WITH]: null
    };
  }
  if (serial in Global.EVALS[serial]) {
    const frames = Global.EVALS[serial];
    const scope = null;
    for (let index = 0; index < frames.length; index++) {
      scope = global_Object_assign({__proto__:scope}, frames[index]);
    }
    return scope;
  }
  throw new global_Error("The received serial number does not refer to a node registered as a direct call to 'eval'.");
};

exports.$Cache = (scope, primitive) => ({
  __proto__: null,
  primitive: primitive
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
    const meta = hide(scope, identifier);
    return closure2({__proto__: null, meta:meta}, Build.write(meta, any));
  }
  closure1({__proto__: null, primitive: any});
};

exports.get = (scope, cache) => {
  if ("meta" in cache) {
    if (scope[cache.meta] === null) {
      return Build.read(cache.meta);
    }
    throw new global_Error("Unbound get cache");
  }
  if ("primitive" in cache) {
    return Buid.primitive(cache.primitive);
  }
  throw new global_Error("Invalid get cache");
};

exports.set = (scope, cache, expression) => {
  if ("meta" in cache) {
    if (scope[cache.meta] === null) {
      return Build.write(cache.meta, expression);
    }
    throw new global_Error("Unbound set cache");
  }
  throw new global_Error("Invalid set cache");
};

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

exports.BLOCK = (scope, labels, identifiers1, identifiers2, closure) => {
  scope = {
    __proto__: scope
  };
  let statements1 = [];
  ArrayLite.forEach([identifiers1, identifier2], (identifiers, index) => {
    ArrayLite.forEach(identifiers, (identifier) => {
      const base = Identifier.Base(identifier);
      if (global_Object_hasOwnProperty(scope, base)) {
        throw new global_Error("Duplicate declaration");
      }
      Reflect_defineProperty(scope, base, {
        __proto__: null,
        writable: true,
        enumerable: true,
        configurable: true,
        value: global_Array_from({
          __proto__: null,
          [INITIALIZED]: false,
          [WRITABLE]: index === 0,
          [DYNAMIC_DEADZONE]: false
        })
      });
    });
  });
  const statements2 = closure(scope);
  const bases = ArrayLite.filter(
    global_Reflect_ownKeys(scope),
    (key) => (
      key[0] !== "@" &&
      scope[key] !== null));
  const metas1 = ArrayLite.filter(
    global_Reflect_ownKeys(scope),
    (key) => (
      key[0] !== "@" &&
      scope[key] === null));
  const metas2 = ArrayLite.map(
    ArrayLite.filter(
      bases,
      (base) => scope[base][DYNAMIC_DEADZONE]),
    (base) =>  Identifier.Meta("TDZ" + base));
  return Build.BLOCK(
    labels,
    ArrayLite.concat(bases, metas1, metas2),
    Array.concat(
      ArrayLite.flatMap(
        metas2,
        (meta) => Build.Expression(
          Build.write(
            meta,
            Build.primitive(false)))),
      statements1,
      statements2));
};

////////////////
// Initialize //
////////////////

exports.initialize = (scope, identifier, expression) => {
  const base = Identifier.Base(identifier);
  if (!global_Object_hasOwnProperty(scope, base)) {
    throw new global_Error("Distant initialization");
  }
  if (scope[base][INITIALIZED]) {
    throw new global_Error("Duplicate initialization");
  }
  scope[base][INITIALIZED] = true;
  return (
    scope[base][DYNAMIC_DEADZONE] ?
    Build.sequence(
      Build.write(
        Identifier.Meta("TDZ" + base),
        Build.primitive(true)),
      Build.write(base, expression)) :
    Build.write(base, expression));
};

////////////
// Lookup //
////////////

const lookup = (scope, boolean, object) => {
  if (scope === null) {
    if (object.identifier === "this" || object.identifier === "new.target") {
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
        // We first evaluation the expression then check if it exists in the
        // global scope.
        (
          (
            (meta) => Build.sequence(
              Build.write(meta, object.expression),
              Build.conditional(
                Object.has(
                  Build.builtin("global"),
                  Build.primitive(object.identifier)),
                Object.set(
                  true,
                  Build.builtin("global"),
                  Build.primitive(object.identifier),
                  Build.read(cache.meta)),
                Build.throw(
                  Build.construct(
                    Build.builtin("ReferenceError"),
                    [
                      Build.primitive(object.identifier + " is not defined")])))))
          (
            hide(scope, "ScopeLookupGlobalRight"))) :
        Object.set(
          false,
          Build.builtin("global"),
          Build.primitive(object.identifier),
          object.expression));
    }
    throw new global_Error("Invalid operation tag");
  }
  if (global_Object_hasOwnProperty(scope, Identifier.Base(identifier))) {
    if (object.tag === "delete") {
      return Build.primitive(false);
    }
    const closure = (closure1) => {
      const closure2 = () => Build.throw(
        Build.construct(
          Build.builtin("ReferenceError"),
          [
            Build.primitive("Cannot access '" + identifier + "' before initalization")]));
      if (scope[Identifier.Base(identifier)][INITIALIZED]) {
        return closure1();
      }
      if (boolean) {
        return closure2();
      }
      scope[Identifier.Base(identifier)][DYNAMIC_DEADZONE] = true;
      return Build.conditional(
        Build.read(
          Identifier.Meta("TDZ" + Identifier.Base(object.identifier))),
        closure1(),
        closure2());
    };
    if (object.tag === "typeof") {
      return closure(
        () => Build.unary(
          "typeof",
          Build.read(Identifier.Base(object.identifier))));
    }
    if (object.tag === "read") {
      return closure(
        () => Build.read(Identifier.Base(object.identifier)));
    }
    if (object.tag === "write") {
      return closure(
        () => (
          scope[Identifier.Base(object.identifier)][WRITABLE] ?
          Build.write(
            Identifier.Base(object.identifier),
            object.expression) :
          Build.throw(
            Build.construct(
              Build.builtin("TypeError"),
              [
                Build.primitive("Assignment to a constant variable")]))));
    }
    throw new global_Error("Invalid operation tag");
  }
  if (global_Object_hasOwnProperty(scope, WITH) && object.identifier !== "this" && object.identifier !== "new.target") {
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
            (meta) => Build.sequence(
              Build.write(
                meta,
                Object.get(
                  Build.read(scope[WITH]),
                  Build.builtin("Symbol.unscopables"))),
              Build.conditional(
                Build.conditional(
                  Build.binary(
                    "===",
                    Build.unary(
                      "typeof",
                      Build.read(meta)),
                    Build.primitive("object")),
                  Build.read(meta),
                  Build.binary(
                    "===",
                    Build.unary(
                      "typeof",
                      Build.read(meta)),
                    Build.primitive("function"))),
                Build.unary(
                  "!",
                  Object.get(
                    Build.read(meta),
                    Build.primitive(identifier))),
                Build.primitive(true))))
          (
            hide(object.scope, "ScopeLookupUnscopables"))),
        Build.primitive(false)),
      closure1(),
      lookup(
        global_Reflect_getPrototypeOf(scope),
        boolean && !global_Object_hasOwnProperty(scope, CLOSURE),
        object));
    if (object.tag === "delete") {
      return closure(
        () => Object.del(
          Build.read(scope[WITH]),
          Build.primitive(object.identifier));
    }
    if (object.tag === "typeof") {
      return closure(
        () => Build.unary(
          "typeof",
          Object.get(
            Build.read(scope[WITH]),
            Build.primitive(object.identifier))));
    }
    if (object.tag === "read") {
      return closure(
        () => Object.get(
          Build.read(scope[WITH]),
          Build.primitive(object.identifier)));
    }
    if (object.tag === "write") {
      return (
        (
          (meta) => Build.sequence(
            Build.write(meta, object.expression),
            (
              object.expression = Build.read(meta),
              closure(
                () => Object.set(
                  object.scope[STRICT],
                  Build.read(scope[WITH]),
                  Build.primitive(object.identifier),  
                  Build.read(meta))))))
        (
          hide(object.scope, "ScopeLookupWithRight")));
    }
    throw new global_Error("Unknown tag");
  }
  return lookup(
    global_Reflect_getPrototypeOf(scope),
    boolean && !global_Object_hasOwnProperty(scope, CLOSURE),
    object);
};

exports.write = (scope, identifier, expression) => lookup(scope, true, {
  __proto__: null,
  tag: "write",
  scope: scope,
  identifier: identifier,
  expression: expression
});

ArrayLite.forEach(["read", "typeof", "delete"], (tag) => {
  exports[tag] = (scope, identifier) => lookup(scope, true, {
    __proto__: null,
    tag: tag,
    scope: scope
  });
});

//////////
// Eval //
//////////

exports.eval = (scope, expression) => {
  const frames = [];
  const local = true;
  while (scope) {
    const frame = {__proto__: null};
    ArrayLite.forEach(global_Reflect_ownKeys(scope), (key) => {
      if (key[0] === "@") {
        frame[key] = scope[key];
      } else if (scope[key] !== null) {
        if (!local && !scope[key][INITIALIZED] && !scope[key][DYNAMIC_DEADZONE]) {
          scope[key][DYNAMIC_DEADZONE] = true;
        }
        frame[key] = scope[key];
      }
    });
    if (global_Object_hasOwnProperty(scope, CLOSURE)) {
      local = false;
    }
  }
  Global.EVALS[Global.SERIAL] = frames;
  return Build.eval(expression);
};

///////////////////
// Undeclarables //
///////////////////

exports.callee = (scope) => Build.read("callee");

exports.newtarget = (scope) => Build.read("new.target");

exports.this = (scope) => Build.read("this");

exports.arguments = (scope) => Build.read("arguments");

exports.error = (scope) => Build.read("error");
