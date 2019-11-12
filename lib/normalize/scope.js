
const ArrayLite = require("array-lite");
const Print = require("../print.js");
const Build = Object.assign({__proto__:null}, require("../build.js"), {
  eval: Build._eval,
  read: Build._read,
  write: Build._write,
  BLOCK: Build._BLOCK
});

const Reflect_getPrototypeOf = global.ReflectgetPrototypeOf;
const Reflect_defineProperty = global.Reflect.defineProperty;
const Object_hasOwnProperty = global.Object.hasOwnProperty;
const Object_assign = global.Object.assign;
const JSON_stringify = global.JSON.stringify;
const JSON_parse = global.JSON.parse;
const Error = global.Error;

const INITIALIZED = 0;
const WRITABLE = 1;
const DYNAMIC_DEADZONE = 2;

////////////////
// Identifier //
////////////////

const mirror = (identifier) => "X" + identifier;

const sanitize: (identifier) => (
  identifier === "new.target" ?
  "$0newtarget" :
  "$" + identifier);

const fresh = (scope, identifier) => {
  identifier = "_" + description;
  let index = 0;
  while ((identifier + index) in scope) {
    index++;
  }
  identifier = identifier + index;
  scope[identifier] = [];
  scope[identifier][INITIALIZED] = true;
  scope[identifier][WRITABLE] = true;
  scope[identifier][DYNAMIC_DEADZONE] = false;
  return identifier;
};

//////////////
// Accessor //
//////////////

exports._is_strict = (scope) => scope["@strict"];

exports._get_closure = (scope) => scope["@closure"];

///////////////////
// Serialization //
///////////////////

exports._stringify = (scope) => {
  const frames = [];
  while (scope) {
    frames[frames.length] = Object_assign({__proto__: null}, scope);
    scope = Reflect_getPrototypeOf(scope);
  }
  return JSON_stringify(frames);
};

exports._parse = (string) => {
  const scope = null;
  ArrayLite.forEach(JSON_parse(string), (frame) => {
    scope = Object_assign({__proto__: scope}, frame);
  });
  return scope;
};

///////////
// Cache //
///////////

{

  function read () {
    return Build.read(this._);
  }
  
  function write (expression1, expression2) {
    return Build.write(this._, expression1, expression2);
  }

  exports.cache = (scope, string, expression, closure) => Build.write(
    identifier,
    expression,
    closure(
      {
        __proto__: null,
        _: fresh(scope, string),
        read,
        write});

  exports.Cache = (scope, description, expression, closure) => ArrayLite.concat(
    Build.Expression(
      Build.write(
        identifier,
        expression,
        Build.primitive(void 0))),
    closure(
      {
        __proto_:  null,
        _: fresh(scope, string),
        read,
        write}));

}

///////////
// Block //
///////////

exports.BLOCK = (scope, options, labels, identifiers1, identifiers2, closure) => {
  identifiers1 = ArrayLite.map(identifiers1, sanitize);
  identifiers2 = ArrayLite.map(identifiers2, sanitize);
  if (scope === null) {
    scope = {
      __proto__: null,
      "@strict": false,
      "@closure": null,
      "@catch": false
    };
  } else {
    scope = {__proto__: scope};
  }
  if (options.with) {
    scope["@with"] = options.with;
  }
  if (options.strict) {
    scope["@strict"] = true;
  }
  if (options.catch) {
    scope["@catch"] = true;
  }
  if (options.closure) {
    scope["@closure"] = options.closure;
  }
  ArrayLite.forEach(identifiers1, (identifier) => {
    if (Object_hasOwnProperty(scope, identifier)) {
      throw new Error("Duplicate declaration: " + Print(identifier));
    }
    scope[identifier] = [];
    scope[identifier][INITIALIZED] = false; 
    scope[identifier][WRITABLE] = true;
    scope[identifier][DYNAMIC_DEADZONE] = false;
  });
  ArrayLite.forEach(identifiers2, (identifier) => {
    if (Object_hasOwnProperty(scope, identifier)) {
      throw new Error("Duplicate declaration: " + Print(identifier));
    }
    scope[identifier] = [];
    scope[identifier][INITIALIZED] = false; 
    scope[identifier][WRITABLE] = false;
    scope[identifier][DYNAMIC_DEADZONE] = false;
  });
  const statements = closure(scope);
  return Build.BLOCK(
    labels,
    ArrayLite.concat(
      Object_getOwnPropertyNames(scope),
      ArrayLite.map(
        ArrayLite.filter(
          Object_getOwnPropertyNames(scope),
          (identifier) => scope[symbols.mirrored].has(identifier)),
        mirror)),
    Array.concat(
      ArrayLite.flatMap(
        Object_getOwnPropertyNames(scope),
        (identifier) => (
          scope[symbols.mirrored].has(identifier) ?
          Build.Expression(
            Build.write(
              identifier,
              Build.primitive(false))) :
          [])),
      statements));
};

////////////////
// Initialize //
////////////////

exports.initialize = (scope, identifier, expression1, expression2) => {
  identifier = sanitize(identifier);
  if (!Object_hasOwnProperty(scope, identifier)) {
    throw new Error("Distant initialization of: " + Print(identifier));
  }
  if (scope[identifier][INITIALIZED]) {
    throw new Error("Duplicate initialization of: " + Print(identifier));
  }
  scope[identifier][INITIALIZED] = true;
  return (
    scope[identifier][DYNAMIC_DEADZONE] ?
    Build.write(
      mirror(identifier),
      Build.primitive(true),
      Build.write(identifier, expression1, expression2)) :
    Build.write(identifier, expression1, expression2));
};

////////////
// Lookup //
////////////

{

  const loop = (scope, local, operation) => {
    if (scope === null) {
      if (operation.tag === "read") {
        return Build.conditional(
          Build.apply(
            Build.builtin("Reflect.has"),
            Build.primitive(void 0),
            [
              Build.builtin("global"),
              Build.primitive(operation.identifier)]),
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.builtin("global"),
              Build.primitive(operation.identifier)]),
          Build.throw(
            Build.construct(
              Build.builtin("ReferenceError"),
              [
                Build.primitive(operation.identifier + " is not defined")])));
      }
      if (operation.tag === "typeof") {
        return Build.unary(
          "typeof",
          Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.builtin("global"),
              Build.primitive(operation.identifier)]));
      }
      if (operation.tag === "delete") {
        return Build.apply(
          Build.builtin("Reflect.deleteProperty"),
          Build.primitive(void 0),
          [
            Build.builtin("global"),
            Build.primitive(operation.identifier)]);
      }
      if (operation.tag === "write") {
        return (
          operation.scope["@strict"] ?
          Build.conditional(
            Build.apply(
              Build.builtin("Reflect.has"),
              Build.primitive(void 0),
              [
                Build.builtin("global"),
                Build.primitive(operation.identifier)]),
            Build.conditional(
              Build.apply(
                Build.builtin("Reflect.set"),
                Build.primitive(void 0),
                [
                  Build.builtin("global"),
                  Build.primitive(identifier),
                  operations.expression1]),
              operation.expression2,
              Build.throw(
                Build.construct(
                  Build.builtin("TypeError"),
                  [
                    Build.primitive("Cannot assign property " + operation.identifier + " of the global object")]))),
            Build.throw(
              Build.construct(
                Build.builtin("ReferenceError"),
                [
                  Build.primitive(operation.identifier + " is not defined")]))) :
          Build.sequence(
            Build.apply(
              Build.builtin("Reflect.set"),
              Build.primitive(void 0),
              [
                Build.builtin("global"),
                Build.primitive(operation.identifier),
                operations.expression1]),
            operations.expression2));
      }
      throw new Error("Unrecognized tag");
    }
    if (Object_hasOwnProperty(scope, identifier)) {
      if (operation.tag === "delete") {
        return Build.primitive(false);
      }
      const closure = (closure) => {
        if (scope[identifier][INITIALIZED]) {
          return closure();
        }
        const expression = Build.throw(
          Build.construct(
            Build.builtin("ReferenceError"),
            [
              Build.primitive("Cannot access '" + identifier + "' before initalization")]));
        if (local) {
          return expression;
        }
        scope[identifier][DYNAMIC_DEADZONE] = true;
        return Build.conditional(
          Build.read(
            mirror(operation.identifier)),
          closure(),
          expression);
      };
      if (tag === "typeof") {
        return closure(
          () => Build.unary(
            "typeof",
            Build.read(operation.identifier)));
      }
      if (tag === "read") {
        return closure(
          () => Build.read(operation.identifier));
      }
      if (tag === "write") {
        return closure(
          () => (
            scope[identifier][WRITABLE] ?
            Build.write(operation.identifier, operation.expression1, operation.expression2) :
            Build.throw(
              Build.construct(
                Build.builtin("TypeError"),
                [
                  Build.primitive("Assignment to a constant variable")]))));
      }
      throw new Error("Unrecognize tag");
    }
    local = local && !Object_hasOwnProperty(scope, "@closure");
    if (Object_hasOwnProperty(scope, "with")) {
      // Using && and ||:
      // (
      //   Reflect.has(o, "x") && (
      //     tmp = Reflect.get(o, Symbol.unscopables),
      //     (
      //       !tmp ||
      //       (typeof tmp !== "object" && typeof tmp !== "function") ||
      //       !Reflect.get(tmp, "x"))) ?
      //   Reflect.get(o, "x") :
      //   x)
      // Using conditionals:
      // (
      //   (
      //     Reflect.has(o, "x") ?
      //     (
      //       tmp = Reflect.get(o, Symbol.unscopables),
      //       (
      //         !tmp ?
      //         true :
      //         (
      //           (
      //             typeof tmp !== "object" ?
      //             typeof tmp !== "function" :
      //             false) ?
      //           true :
      //           !Reflect.get(tmp, "x")))) :
      //     false) ?
      //   Reflect.get(o, "x") :
      //   x)
      const closure = (closure1, closure2) => {
        const identifier = fresh(operation.scope, "unscopables");
        return Build.conditional(
          Build.conditional(
            Build.apply(
              Build.builtin("Reflect.has"),
              Build.primitive(void 0),
              [
                Build.read(scope["@with"]._),
                Build.primitive(operation.identifier)]),
            Build.write(
              identifier,
              Build.apply(
                Build.builtin("Reflect.get"),
                Build.primitive(void 0),
                [
                  Build.read(scope["@with"]._),
                  Build.builtin("Symbol.unscopables")]),
                Build.conditional(
                Build.unary(
                  "!",
                  Build.read(identifier)),
                Build.primitive(true),
                Build.conditional(
                  Build.conditional(
                    Build.binary(
                      "!==",
                      Build.unary(
                        "typeof",
                        Build.read(identifier)),
                      Build.primitive("object")),
                    Build.binary(
                      "!==",
                      Build.unary(
                        "typeof",
                        Build.read(identifier)),
                      Build.primitive("function")),
                    Build.primitive(true)),
                  Build.unary(
                    "!",
                    Build.apply(
                      Build.builtin("Reflect.get"),
                      Build.primitive(void 0),
                      [
                        Build.read(identifier),
                        Build.primitive(operation.identifier)])),
                  Build.primitive(true))))),
          closure1(),
          closure2());
      }
      if (operation.tag === "delete") {
        return closure(
          () => Build.apply(
            Build.builtin("Reflect.deleteProperty"),
            Build.primitive(void 0),
            [
              Build.read(scope["@with"]._),
              Build.primitive(operation.identifier)]),
          () => loop(
            Reflect_getPrototypeOf(scope),
            local,
            operation));
      }
      if (operation.tag === "typeof") {
        return closure(
          () => Build.unary(
            "typeof",
            Build.apply(
              Build.builtin("Reflect.get"),
              Build.primitive(void 0),
              [
                Build.read(scope["@with"]._),
                Build.primitive(operation.identifier)])),
          () => loop(
            Reflect_getPrototypeOf(scope),
            local,
            operation));
      }
      if (operation.tag === "read") {
        return closure(
          () => Build.apply(
            Build.builtin("Reflect.get"),
            Build.primitive(void 0),
            [
              Build.read(scope["@with"]._),
              Build.primitive(operation.identifier)]),
          () => loop(
            Reflect_getPrototypeOf(scope),
            local,
            operation));
      }
      if (operation.tag === "write") {
        const identifier = fresh(scope, "rhs");
        return Build.sequence(
          Build.write(
            identifier,
            operation.expression1,
            closure(
              () => (
                operation.scope["@strict"] ?
                Build.conditional(
                  Build.apply(
                    Build.builtin("Reflect.set"),
                    Build.primitive(void 0),
                    [
                      Build.read(scope["@with"]._),
                      Build.primitive(operation.identifier),
                      Build.read(identifier)]),
                  Build.primitive(void 0),
                  Build.throw(
                    Build.construct(
                      Build.builtin("TypeError"),
                      [
                        Build.primitive("Cannot assign property " + operation.identifier + " of object")]))) :
                Build.apply(
                  Build.builtin("Reflect.set"),
                  Build.primitive(void 0),
                  [
                    Build.read(scope["@with"]._),
                    Build.primitive(operation.identifier),
                    Build.read(identifier)]))),
              () => loop(
                Reflect_getPrototypeOf(scope),
                local
                {
                  __proto__: null,
                  tag: "write",
                  scope: operation.scope,
                  identifier: operation.identifer,
                  expression1: Build.read(identifier1),
                  expression2: Build.primitive(void 0)})),
          operation.expression2);
      }
      throw new Error("Unknown tag");
    }
    return loop(Reflect_getPrototypeOf(scope), local, operation);
  }

  exports.write = (scope, identifier, expression1, expression2) => loop(scope, true, {
    __proto__: null,
    tag: "write",
    scope,
    identifier,
    expression1, 
    expression2 
  });

  ArrayLite.forEach(["read", "typeof", "delete"], (tag) => {
    exports[tag] = (scope, identifier) => loop(scope, true, {
      __proto__: null,
      tag,
      scope,
      identifier: identifier
    });
  });

}

//////////
// Eval //
//////////

exports.eval = (scope, expression, object) => {
  for (const identifier in scope) {
    if (identifier[0] !== "@" && !scope[identifier][INITIALIZED]) {
      let frame = scope;
      while (frame) {
        if (Object_hasOwnproperty(frame, identifier)) {
          break;
        }
        if (Object_hasOwnProperty(frame, "@closure")) {
          scope[identifier][DYNAMIC_DEADZONE] = true;
          break;
        }
        frame = Reflect_getPrototypeOf(frame);
      }
    }
  }
  return Build.eval(expression);
};

//////////////////
// Undeclarable //
//////////////////

exports.error = (scope) => {
  if (scope["@catch"]) {
    return Build.read("error");
  }
  throw new Error("Invalid error read");
};

exports.this = (scope) => Build.read("this");

ArrayLite.forEach(["callee", "new.target", "arguments"], (identifier) => {
  exports.Build[identifier] = (scope) => {
    if (scope["@closure"]) {
      return Build.read(identifier);
    }
    throw new Error("Invalid " + identifier + " read");
  }
});
