
const ArrayLite = require("array-lite");

const sanitize = (identifier) => {
  if (identifier === "new.target")
    return "_new_target";
  if (identifier === "this")
    return "_this";
  return "$" + identifier;
};

// let target = arguments[0]["*inner*"];
const declare_target = (input) => input.Declare(
  "let",
  "target",
  input.get(
    input.get(
      input.read("arguments"),
      input.literal(0)),
    input.literal("*inner*")));

// https://jsperf.com/substring-loop-vs-reflect/1
// let key = "";
// let index = 1;
// let length = arguments[1].length;
// while (index < length) {
//   key = key + argument[1][index];
// }
const declare_key = (input) => ArrayLite.concat(
  input.Declare(
    "let",
    "key",
    input.literal("")),
  input.Declare(
    "let",
    "index",
    input.literal(1)),
  input.Declare(
    "let",
    "length",
    input.get(
      input.get(
        input.read("arguments"),
        input.literal(1)),
      input.literal("length"))),
  input.While(
    input.binary(
      "<",
      input.read("index"),
      input.read("length")),
    input.Statement(
      input.write(
        "key",
        input.binary(
          "+",
          input.read("key"),
          input.get(
            input.get(
              input.read("arguments"),
              input.literal(1)),
            input.read("index")))))));

// let value = arguments[2];
const declare_value = (input) => input.Declare(
  "let",
  "value",
  input.get(
    input.read("arguments"),
    input.literal(2)));

// with (META._Proxy({"*inner*":EXPRESSION}, META._static_mangling_(Local|Global)WithHandlers)) {
//   STATEMENTS;
// }
const with_helper = (input, string) => (expression, statements) => input.With(
  input.construct(
    input.load("Proxy"),
    [
      input.object(
        [
          [
            "*inner*",
            expression]]),
      input.load(string)]),
  statements);

// We could embed here the detection of strict mode
// through a monitoring of the call stack. This would
// require the modification of Return, Try and closure
// and the creation of strict_closure. This last point
// is a big no-no for me as I want to delegate strict
// mode handling to lib/weave. The only remaining sign
// of strict mode is a check in the set trap for with
// statements. I can live with that and you should too.

module.exports = (input) => Object_assign(
  {
    With: with_helper(input, "LocalWithHandlers"),
    Sandbox: with_helper(input, "GlobalWithHandlers"),
    $Declare: (kind, identifier, expression) => input.Declare(
      kind,
      sanitize(identifier),
      expression),
    $write: (identifier, expression) => input.write(
      sanitize(identifier),
      expression),
    $discard: (identifier) => input.discard(
      sanitize(identifier)),
    $read: (identifier) => input.read(
      sanitize(identifier)),
    PROGRAM: (statements) => ArrayLite.concat(
      input.If(
        input.load("Proxy"),
        ArrayLite.concat(
          // META._static_mangling_Proxy = Proxy;
          input.Statement(
            input.save(
              "mangling",
              "Proxy",
              input.read("Proxy"))),
          // META._static_mangling_ReferenceError = ReferenceError;
          input.Statement(
            input.save(
              "mangling",
              "ReferenceError",
              input.read("ReferenceError"))),
          // META._static_mangling_TypeError = TypeError;
          input.Statement(
            input.save(
              "mangling",
              "TypeError",
              input.read("TypeError"))),
          // META._static_mangling_Reflect_set = Reflect.set;
          input.Statement(
            input.save(
              "mangling",
              "Reflect_set",
              input.get(
                input.read("Reflect"),
                input.literal("set")))),
          // META._static_mangling_LocalHandlers = {
          //   has: function callee () {
          //     if (arguments[1][0] === "$") {
          //       DECLARE_TARGET;
          //       DECLARE_KEY;
          //       return key in target;
          //     } else {
          //       return false;
          //     }
          //   },
          //   get: function callee () {
          //     DECLARE_TARGET;
          //     if (typeof arguments[1] === "symbol") {
          //       return target[arguments[1]];
          //     } else {
          //       DECLARE_KEY
          //       return target[key];
          //     }
          //   },
          //   set: function callee () {
          //     DECLARE_TARGET;
          //     DECLARE_KEY;
          //     DECLARE_VALUE;
          //     if (IS_STRICT) {
          //       if (META._Reflect_set(target, key, value)) {
          //         return true;
          //       } else {
          //         throw new META._TypeError("cannot assign object property");
          //       }
          //     } else {
          //       return META._Reflect_set(target, key, value);
          //     }
          //   },
          //   deleteProperty: function callee () {
          //     DECLARE_TARGET;
          //     DECLARE_KEY;
          //     return delete target[key];
          //   }
          // }
          input.Statement(
            input.save(
              "LocalWithHandlers",
              input.object(
                [
                  [
                    "has",
                    input.closure(
                      input.If(
                        input.binary(
                          "===",
                          input.get(
                            input.get(
                              input.read("arguments"),
                              input.literal(1)),
                            input.literal(0)),
                          input.literal("$")),
                        ArrayLite.concat(
                          declare_target(input),
                          declare_key(input),
                          input.Return(
                            input.binary(
                              "in",
                              input.read("key"),
                              input.read("target")))),
                        input.Return(
                          input.literal(false))))],
                  [
                    "get",
                    input.closure(
                      ArrayLite.concat(
                        declare_target(input),
                        input.If(
                          input.binary(
                            "===",
                            input.unary(
                              "typeof",
                              input.get(
                                input.read("arguments"),
                                input.literal(1))),
                            input.literal("symbol")),
                          input.Return(
                            input.get(
                              input.read("target"),
                              input.get(
                                input.read("arguments"),
                                input.literal(1)))),
                          ArrayLite.concat(
                            declare_key(input),
                            input.Return(
                              input.get(
                                input.read("target"),
                                input.read("key")))))))],
                  [
                    "set",
                    input.closure(
                      ArrayLite.concat(
                        declare_target(input),
                        declare_key(input),
                        declare_value(input),
                        input.If(
                          input.load("mangling", "strict"),
                          input.If(
                            input.call(
                              input.load("mangling", "Reflect_set"),
                              [
                                input.read("target"),
                                input.read("key"),
                                input.read("value")]),
                            input.Return(
                              input.literal(true)),
                            input.Throw(
                              input.construct(
                                input.load("mangling", "TypeError"),
                                [
                                  input.literal("cannot assign object property")]))),
                          input.Return(
                            input.call(
                              input.load("mangling", "Reflect_set"),
                              [
                                input.read("target"),
                                input.read("key"),
                                input.read("value")])))))],
                  [
                    "deleteProperty",
                    input.closure(
                      ArrayLite.concat(
                        declare_target(input),
                        declare_key(input),
                        input.Return(
                          input.delete(
                            input.read("target"),
                            input.read("key")))))]]))),
          // META._static_mangling_GlobalHandler: {
          //   has: function callee () {
          //     return arguments[1][0] === "$";
          //   },
          //   get: function callee () {
          //     if (typeof arguments[1] === "symbol") {
          //       return false;
          //     } else {
          //       DECLARE_TARGET;
          //       DECLARE_KEY;
          //       if (key in target) {
          //         return target[key];
          //       } else {
          //         throw new META._ReferenceError("variable not defined");
          //       }
          //     }
          //   },
          //   set: function callee () {
          //     DECLARE_TARGET;
          //     DECLARE_KEY;
          //     DECLARE_VALUE;
          //     if (IS_STRICT) {
          //       if (key in target) {
          //         if (META._Reflect_set(target, key, value)) {
          //           return true;
          //         } else {
          //           throw new META._TypeError("cannot assign object property");
          //         }
          //       } else {
          //         new META._ReferenceError("variable not defined");
          //       }
          //     } else {
          //       return META._Reflect_set(target, key, value);
          //     }
          //   },
          //   deleteProperty: function callee () {
          //     DECLARE_TARGET;
          //     DECLARE_KEY;
          //     return delete target[key];
          //   }
          // }
          input.Statement(
            input.save(
              "GlobalWithHandlers",
              input.object(
                [
                  [
                    "has",
                    input.closure(
                      input.Return(
                        input.binary(
                          "===",
                          input.get(
                            input.get(
                              input.read("arguments"),
                              input.literal(1)),
                            input.literal(0)),
                          input.literal("$"))))],
                  [
                    "get",
                    input.closure(
                      input.If(
                        input.binary(
                          "===",
                          input.unary(
                            "typeof",
                            input.get(
                              input.read("arguments"),
                              input.literal(1))),
                          input.literal("symbol")),
                        input.Return(
                          input.literal(false)),
                        ArrayLite.concat(
                          declare_target(input),
                          declare_key(input),
                          input.If(
                            input.binary(
                              "in",
                              input.read("key"),
                              input.read("target")),
                            input.Return(
                              input.get(
                                input.read("target"),
                                input.read("key"))),
                            input.Throw(
                              input.construct(
                                input.load("mangling", "ReferenceError"),
                                [
                                  input.literal("variable not defined")]))))))],
                  [
                    "set",
                    input.closure(
                      ArrayLite.concat(
                        declare_target(input),
                        declare_key(input),
                        declare_value(input),
                        input.If(
                          input.load("mangling", "strict"),
                          input.If(
                            input.binary(
                              "in",
                              input.read("key"),
                              input.read("target")),
                            input.If(
                              input.call(
                                input.load("mangling", "Reflect.set"),
                                [
                                  input.read("target"),
                                  input.read("key"),
                                  input.read("value")]),
                              input.Return(
                                input.literal(true)),
                              input.Throw(
                                input.construct(
                                  input.load("mangling", "TypeError"),
                                  [
                                    input.literal("cannot assign object property")]))),
                            input.Throw(
                              input.construct(
                                input.load("mangling", "ReferenceError"),
                                [
                                  input.literal("variable not defined")]))),
                          input.Return(
                            input.call(
                              input.load("mangling", "Reflect.set"),
                              [
                                input.read("target"),
                                input.read("key"),
                                input.read("value")])))))],
                  [
                    "deleteProperty",
                    input.closure(
                      ArrayLite.concat(
                        declare_target(input),
                        declare_key(input),
                        input.Return(
                          input.delete(
                            input.read("target"),
                            input.read("key")))))]]))))))},
  input);
