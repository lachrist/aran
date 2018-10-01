
const ArrayLite = require("array-lite");

const sanitize = (identifier) => {
  if (identifier === "new.target")
    return "_new_target";
  if (identifier === "this")
    return "_this";
  return "$" + identifier;
};

// let target = arguments[0]["*inner*"];
const declare_target = (format) => format.Declare(
  "let",
  "target",
  format.get(
    format.get(
      format.read("arguments"),
      format.primitive(0)),
    format.primitive("*inner*")));

// https://jsperf.com/substring-loop-vs-reflect/1
// let key = "";
// let index = 1;
// let length = arguments[1].length;
// while (index < length) {
//   key = key + argument[1][index];
// }
const declare_key = (format) => ArrayLite.concat(
  format.Declare(
    "let",
    "key",
    format.primitive("")),
  format.Declare(
    "let",
    "index",
    format.primitive(1)),
  format.Declare(
    "let",
    "length",
    format.get(
      format.get(
        format.read("arguments"),
        format.primitive(1)),
      format.primitive("length"))),
  format.While(
    format.binary(
      "<",
      format.read("index"),
      format.read("length")),
    format.Statement(
      format.write(
        "key",
        format.binary(
          "+",
          format.read("key"),
          format.get(
            format.get(
              format.read("arguments"),
              format.primitive(1)),
            format.read("index")))))));

// let value = arguments[2];
const declare_value = (format) => format.Declare(
  "let",
  "value",
  format.get(
    format.read("arguments"),
    format.primitive(2)));

// with (META._Proxy({"*inner*":EXPRESSION}, META[STRING])) {
//   STATEMENTS;
// }
const with_helper = (format, string) => (expression, statements) => format.With(
  format.construct(
    format.load("Proxy"),
    [
      format.object(
        [
          [
            "*inner*",
            expression]]),
      format.load(string)]),
  statements);

const closure_helper = (format, boolean) => (statements) => format.closure(
  ArrayLite.concat(
    format.Statement(
      format.set(
        format.load("StrictStack"),
        format.get(
          format.load("StrictStack"),
          format.primitive("length")),
        format.primitive(boolean))),
    statements));

module.exports = (format) => Object_assign(
  {
    // META._StrictStack.length = META._StrictStack.length - 1;
    // return #expression;
    Return: (expression) => ArrayLite.concat(
      format.Statement(
        format.set(
          format.load("StrictStack"),
          format.primitive("length"),
          format.binary(
            "-",
            format.get(
              format.load("StrictStack"),
              format.primitive("length")),
            format.primitive(1)))),
      format.Return(expression)),
    // function callee () {
    //   META._StrictStack[META.StrictStack.length] = true;
    //   STATEMENTS;
    // }
    strict_closure: closure_helper(format, true),
    // function callee () {
    //   META._StrictStack[META.StrictStack.length] = false;
    //   STATEMENTS;
    // }
    closure: closure_helper(format, false),
    // try {
    //   META._StrictLengthStack[META._StrictLengthStack.length] = META._StrictStack.length;
    //   STATEMENTS1
    // } catch (error) {
    //   META._StrictStack.length = META._StrictLengthStack[META._StrictLengthStack.length-1];
    //   STATEMENTS2;
    // } finally {
    //   META._StrictLengthStack.length = META._StrictLengthStack.length - 1;
    //   STATEMENTS3;
    // }
    Try: (statements1, statements2, statements3) => format.Try(
      ArrayLite.concat(
        format.Statement(
          format.set(
            format.load("StrictLengthStack"),
            format.get(
              format.load("StrictLengthStack"),
              format.primitive("length")),
            format.get(
              format.load("StrictStack"),
              format.primitive("length")))),
        statements1),
      ArrayLite.concat(
        format.Statement(
          format.set(
            format.load("StrictStack"),
            format.primitive("length"),
            format.get(
              format.load("StrictLengthStack"),
              format.binary(
                "-",
                format.get(
                  format.load("StrictLengthStack"),
                  format.primitive("length")),
                format.primitive(1))))),
        statements2),
      ArrayLite.concat(
        format.Statement(
          format.set(
            format.load("StrictStack"),
            format.primitive("length"),
            format.binary(
              "-",
              format.get(
                format.load("StrictLengthStack"),
                format.primitive("length")),
              format.primitive(1)))),
        statements3)),
    With: with_helper(format, format, "LocalWithHandlers"),
    Sandbox: with_helper(format, format, "GlobalWithHandlers"),
    SanitizeDeclare: (kind, identifier, expression) => format.Declare(
      kind,
      sanitize(identifier),
      expression),
    sanitize_write: (identifier, expression) => format.write(
      sanitize(identifier),
      expression),
    sanitize_discard: (identifier) => format.discard(
      sanitize(identifier)),
    sanitize_read: (identifier) => format.read(
      sanitize(identifier)),
    PROGRAM: (statements) => ArrayLite.concat(
      format.If(
        format.load("StrictStack"),
        ArrayLite.concat(
          // META._StrictStack = [];
          format.Statement(
            format.save(
              "StrictStack",
              format.array([]))),
          // META._StrictLengthStack = [];
          format.Statement(
            format.save(
              "StrictLengthStack",
              format.array([]))),
          // META._LocalHandlers = {
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
          format.Statement(
            format.save(
              "LocalWithHandlers",
              format.object(
                [
                  [
                    "has",
                    format.closure(
                      format.If(
                        format.binary(
                          "===",
                          format.get(
                            format.get(
                              format.read("arguments"),
                              format.primitive(1)),
                            format.primitive(0)),
                          format.primitive("$")),
                        ArrayLite.concat(
                          declare_target(format),
                          declare_key(format),
                          format.Return(
                            format.binary(
                              "in",
                              format.read("key"),
                              format.read("target")))),
                        format.Return(
                          format.primitive(false))))],
                  [
                    "get",
                    format.closure(
                      ArrayLite.concat(
                        declare_target(format),
                        format.If(
                          format.binary(
                            "===",
                            format.unary(
                              "typeof",
                              format.get(
                                format.read("arguments"),
                                format.primitive(1))),
                            format.primitive("symbol")),
                          format.Return(
                            format.get(
                              format.read("target"),
                              format.get(
                                format.read("arguments"),
                                format.primitive(1)))),
                          ArrayLite.concat(
                            declare_key(format),
                            format.Return(
                              format.get(
                                format.read("target"),
                                format.read("key")))))))],
                  [
                    "set",
                    format.closure(
                      ArrayLite.concat(
                        declare_target(format),
                        declare_key(format),
                        declare_value(format),
                        format.If(
                          format.load("strict"),
                          format.If(
                            format.apply(
                              format.load("Reflect.set"),
                              [
                                format.read("target"),
                                format.read("key"),
                                format.read("value")]),
                            format.Return(
                              format.primitive(true)),
                            format.Throw(
                              format.construct(
                                format.load("TypeError"),
                                [
                                  format.primitive("cannot assign object property")]))),
                          format.Return(
                            format.apply(
                              format.load("Reflect.set"),
                              [
                                format.read("target"),
                                format.read("key"),
                                format.read("value")])))))],
                  [
                    "deleteProperty",
                    format.closure(
                      ArrayLite.concat(
                        declare_target(format),
                        declare_key(format),
                        format.Return(
                          format.delete(
                            format.read("target"),
                            format.read("key")))))]]))),
          // META._GlobalHandler: {
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
          format.Statement(
            format.save(
              "GlobalWithHandlers",
              format.object(
                [
                  [
                    "has",
                    format.closure(
                      format.Return(
                        format.binary(
                          "===",
                          format.get(
                            format.get(
                              format.read("arguments"),
                              format.primitive(1)),
                            format.primitive(0)),
                          format.primitive("$"))))],
                  [
                    "get",
                    format.closure(
                      format.If(
                        format.binary(
                          "===",
                          format.unary(
                            "typeof",
                            format.get(
                              format.read("arguments"),
                              format.primitive(1))),
                          format.primitive("symbol")),
                        format.Return(
                          format.primitive(false)),
                        ArrayLite.concat(
                          declare_target(format),
                          declare_key(format),
                          format.If(
                            format.binary(
                              "in",
                              format.read("key"),
                              format.read("target")),
                            format.Return(
                              format.get(
                                format.read("target"),
                                format.read("key"))),
                            format.Throw(
                              format.construct(
                                format.load("ReferenceError"),
                                [
                                  format.primitive("variable not defined")]))))))],
                  [
                    "set",
                    format.closure(
                      ArrayLite.concat(
                        declare_target(format),
                        declare_key(format),
                        declare_value(format),
                        format.If(
                          format.load("strict"),
                          format.If(
                            format.binary(
                              "in",
                              format.read("key"),
                              format.read("target")),
                            format.If(
                              format.apply(
                                format.load("Reflect.set"),
                                [
                                  format.read("target"),
                                  format.read("key"),
                                  format.read("value")]),
                              format.Return(
                                format.primitive(true)),
                              format.Throw(
                                format.construct(
                                  format.load("TypeError"),
                                  [
                                    format.primitive("cannot assign object property")]))),
                            format.Throw(
                              format.construct(
                                format.load("ReferenceError"),
                                [
                                  format.primitive("variable not defined")]))),
                          format.Return(
                            format.apply(
                              format.load("Reflect.set"),
                              [
                                format.read("target"),
                                format.read("key"),
                                format.read("value")])))))],
                  [
                    "deleteProperty",
                    format.closure(
                      ArrayLite.concat(
                        declare_target(format),
                        declare_key(format),
                        format.Return(
                          format.delete(
                            format.read("target"),
                            format.read("key")))))]]))))},
  format);
