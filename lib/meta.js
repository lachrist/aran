
const ArrayLite = require("array-lite");

exports.apply = (expression1, expression2, expressions) => ARAN.build.apply(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("REFLECT_APPLY")),
  [
    expression1,
    expression2,
    ARAN.build.array(expressions)]);

exports.sproxy = (expression) => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    expression,
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive(ARAN.node.AranStrict ? "STRICT_SANDBOX_HANDLERS" : "SANDBOX_HANDLERS"))]);

exports.wproxy = (expression) => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    expression,
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("WITH_HANDLERS"))]);

exports.trigger = (string, expressions) => ARAN.build.invoke(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive(string),
  expressions);

exports.eval = () => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("EVAL"));

exports.load = (string) => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("SAVE_" + string));

exports.save = (string, expression) => ARAN.build.set(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("SAVE_" + string),
  expression);

exports.define = (expression1, string, expression2, boolean1, boolean2, boolean3) => ARAN.build.apply(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("OBJECT_DEFINE_PROPERTY")),
  [
    expression1,
    ARAN.build.primitive(string),
    ARAN.build.object(
      ArrayLite.concat(
        [
          [
            "value",
            expression2]],
        (
          boolean1 ?
          [
            [
              "writable",
              ARAN.build.primitive(true)]] :
          []),
        (
          boolean2 ?
          [
            [
              "enumerable",
              ARAN.build.primitive(true)]] :
          []),
        (
          boolean3 ?
          [
            [
              "configurable",
              ARAN.build.primitive(true)]] :
          [])))]);

exports.SETUP = () => ARAN.build.PROGRAM(
  false,
  ArrayLite.concat(
    // META.EVAL = if (!("EVAL" in META)) META.EVAL = eval;
    // META.GLOBAl = if (!("GLOBAL" in META)) META.GLOBAL = META.EVAL("this");
    // META.PROXY = if (!("PROXY" in META)) META.PROXY = Proxy;
    // META.OBJECT_DEFINE_PROPERTY = if (!("OBJECT_DEFINE_PROPERTY" in META)) META.OBJECT_DEFINE_PROPERTY = Object.defineProperty;
    // META.REFLECT_APPLY = if (!("REFLECT_APPLY" in META)) META.REFLECT_APPLY = Reflect.apply;
    // META.REFERENCE_ERROR = if (!("REFERENCE_ERROR" in META)) META.REFERENCE_ERROR = ReferenceError;
    ArrayLite.flatenMap(
      [
        [
          "EVAL",
          ARAN.build.read("eval")],
        [
          "PROXY",
          ARAN.build.read("Proxy")],
        [
          "OBJECT_DEFINE_PROPERTY",
          ARAN.build.get(
            ARAN.build.read("Object"),
            ARAN.build.primitive("defineProperty"))],
        [
          "REFLECT_APPLY",
          ARAN.build.get(
            ARAN.build.read("Reflect"),
            ARAN.build.primitive("apply"))],
        [
          "REFERENCE_ERROR",
          ARAN.build.read("ReferenceError")]],
      (pair) => ARAN.build.If(
        ARAN.build.unary(
          "!",
          ARAN.build.binary(
            "in",
            ARAN.build.primitive(pair[0]),
            ARAN.build.read(ARAN.namespace))),
        ARAN.build.Statement(
          ARAN.build.set(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive(pair[0]),
            pair[1])),
        [])),
    // This is only useful for sandbox-free weaving.
    // META.EVAL("this").$$eval = META.EVAL("this").eval;
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.invoke(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive("EVAL"),
          [
            ARAN.build.primitive("this")]),
        ARAN.build.primitive("$$eval"),
        ARAN.build.get(
          ARAN.build.invoke(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("EVAL"),
            [
              ARAN.build.primitive("this")]),
          ARAN.build.primitive("eval")))),
    // META.WITH_HANDLERS = {
    //   has: (target, key) => {
    //     if (key === "$$this") {
    //       return false;
    //     }
    //     if (key === "$newtarget") {
    //       return false;
    //     }
    //     if (key === "error") {
    //       return false;
    //     }
    //     if (key === "arguments") {
    //       return false;
    //     }
    //     if (key === "completion") {
    //       return false;
    //     }
    //     if (key[0] !== "M") {
    //       return false;
    //     }
    //     if (key[1] !== "E") {
    //       return false;
    //     }
    //     if (key[2] !== "T") {
    //       return false;
    //     }
    //     if (key[3] !== "A") {
    //       return false;
    //     }
    //     RESTORE
    //     return key in target;
    //   },
    //   get: (target, key, receiver) => {
    //     if (typeof target === "symbol") {
    //       return target[key];
    //     }
    //     RESTORE
    //     return target[key];
    //   },
    //   set: (target, key, value, receiver) => {
    //     RESTORE
    //     target[key] = value;
    //   },
    //   deleteProperty (target, key) => {
    //     RESTORE
    //     return delete target[key];
    //   }
    // };
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive("WITH_HANDLERS"),
        ARAN.build.object(
          [
            [
              "has",
              ARAN.build.function(
                false,
                ["target", "key"],
                ArrayLite.concat(
                  ArrayLite.flatenMap(
                    ["$$this", "$newtarget", "error", "arguments", "completion"],
                    (string) => ARAN.build.If(
                      ARAN.build.binary(
                        "===",
                        ARAN.build.read("key"),
                        ARAN.build.primitive(string)),
                      ARAN.build.Return(
                        ARAN.build.primitive(false)),
                      [])),
                  ArrayLite.flatenMap(
                    ARAN.namespace,
                    (string, index) => ARAN.build.If(
                      ARAN.build.binary(
                        "===",
                        ARAN.build.get(
                          ARAN.build.read("key"),
                          ARAN.build.primitive(index)),
                        ARAN.build.primitive(ARAN.namespace[index])),
                      ARAN.build.Return(
                        ARAN.build.primitive(false)),
                      [])),
                  restore(),
                  ARAN.build.Return(
                    ARAN.build.binary(
                      "in",
                      ARAN.build.read("key"),
                      ARAN.build.read("target")))))],
            [
              "get",
              ARAN.build.function(
                false,
                ["target", "key", "receiver"],
                ArrayLite.concat(
                  ARAN.build.If(
                    ARAN.build.binary(
                      "===",
                      ARAN.build.unary(
                        "typeof",
                        ARAN.build.read("key")),
                      ARAN.build.primitive("symbol")),
                    ARAN.build.Return(
                      ARAN.build.get(
                        ARAN.build.read("target"),
                        ARAN.build.read("key"))),
                    []),
                  restore(),
                  ARAN.build.Return(
                    ARAN.build.get(
                      ARAN.build.read("target"),
                      ARAN.build.read("key")))))],
            [
              "set",
              ARAN.build.function(
                false,
                ["target", "key", "value", "receiver"],
                ArrayLite.concat(
                  restore(),
                  ARAN.build.Statement(
                    ARAN.build.set(
                      ARAN.build.read("target"),
                      ARAN.build.read("key"),
                      ARAN.build.read("value")))))],
            [
              "deleteProperty",
              ARAN.build.function(
                false,
                ["target", "key"],
                ArrayLite.concat(
                  restore(),
                  ARAN.build.Return(
                    ARAN.build.delete(
                      ARAN.build.read("target"),
                      ARAN.build.read("key")))))]]))),
    // META.SANDBOX_HANDLERS = {
    //   has: (target, key) => {
    //     return true;
    //   },
    //   get: (target, key, receiver) => {
    //     if (typeof key === "symbol") {
    //       return void 0;
    //     }
    //     RESTORE
    //     if (key in target) {
    //       return target[key];
    //     }
    //     throw new META.REFERENCE_ERROR(key+" is not defined");
    //   },
    //   set: META.HANDLERS.set,
    //   deleteProperty: META.HANDLERS.deleteProeperty
    // };
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive("SANDBOX_HANDLERS"),
        ARAN.build.object([
          [
            "has",
            ARAN.build.function(
              false,
              ["target", "key"],
              ARAN.build.Return(
                ARAN.build.primitive(true)))],
          [
            "get",
            ARAN.build.function(
              false,
              ["target", "key", "receiver"],
              ArrayLite.concat(
                ARAN.build.If(
                  ARAN.build.binary(
                    "===",
                    ARAN.build.unary(
                      "typeof",
                      ARAN.build.read("key")),
                    ARAN.build.primitive("symbol")),
                  ARAN.build.Return(
                    ARAN.build.primitive(void 0)),
                  []),
                restore(),
                ARAN.build.If(
                  ARAN.build.binary(
                    "in",
                    ARAN.build.read("key"),
                    ARAN.build.read("target")),
                  ARAN.build.Return(
                    ARAN.build.get(
                      ARAN.build.read("target"),
                      ARAN.build.read("key"))),
                  []),
                ARAN.build.Throw(
                  ARAN.build.construct(
                    ARAN.build.get(
                      ARAN.build.read(ARAN.namespace),
                      ARAN.build.primitive("REFERENCE_ERROR")),
                    [
                      ARAN.build.binary(
                        "+",
                        ARAN.build.read("key"),
                        ARAN.build.primitive(" is not defined"))]))))],
          [
            "set",
            ARAN.build.get(
              ARAN.build.get(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("WITH_HANDLERS")),
              ARAN.build.primitive("set"))],
          [
            "deleteProperty",
            ARAN.build.get(
              ARAN.build.get(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("WITH_HANDLERS")),
              ARAN.build.primitive("deleteProperty"))]]))),
    // META.STRICT_SANDBOX_HANDLERS = {
    //   has: META.GLOBAL_HANDLERS.has,
    //   get: META.GLOBAL_HANDLERS.get,
    //   set: (target, key, value, receiver) => {
    //     RESTORE
    //     if (key in target) {
    //       target[key] = value;
    //     } else {
    //       // global variables are forbidden in strict mode
    //       throw new META.REFERENCE_ERROR(key+" is not defined");
    //     }
    //   },
    //   deleteProperty: META.GLOBAL_HANDLERS.deleteProperty
    // };
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive("STRICT_SANDBOX_HANDLERS"),
        ARAN.build.object(
          [
            [
              "has",
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("SANDBOX_HANDLERS")),
                ARAN.build.primitive("has"))],
            [
              "get",
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("SANDBOX_HANDLERS")),
                ARAN.build.primitive("get"))],
            [
              "set",
              ARAN.build.function(
                false,
                ["target", "key", "value", "receiver"],
                ArrayLite.concat(
                  restore(),
                  ARAN.build.If(
                    ARAN.build.binary(
                      "in",
                      ARAN.build.read("key"),
                      ARAN.build.read("target")),
                    ARAN.build.Statement(
                      ARAN.build.set(
                        ARAN.build.read("target"),
                        ARAN.build.read("key"),
                        ARAN.build.read("value"))),
                    ARAN.build.Throw(
                      ARAN.build.construct(
                        ARAN.build.get(
                          ARAN.build.read(ARAN.namespace),
                          ARAN.build.primitive("REFERENCE_ERROR")),
                        [
                          ARAN.build.binary(
                            "+",
                            ARAN.build.read("key"),
                            ARAN.build.primitive(" is not defined"))])))))],
            [
              "deleteProperty",
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("SANDBOX_HANDLERS")),
                ARAN.build.primitive("deleteProperty"))]])))));

// RESTORE :=
// if (key[0] === "$") {
//   if (key[1] === "$") {
//     var index = 2;
//     var infix = "";
//     while (key[index] === "$") {
//       infix = infix + "$";
//       index = index + 1;
//     }
//     var prefix = "$$" + infix;
//     if (key === prefix + "eval") {
//       key = infix + "eval";
//     } else {
//       if (key === prefix + "callee") {
//         key = infix + "callee";
//       } else {
//         if (key === prefix + "error") {
//           key = infix + "error";
//         } else {
//           if (key === prefix + "arguments") {
//             key = infix + "arguments";
//           } else {
//             if (key === prefix + "completion") {
//               key = infix + "completion";
//             } else {
//               if (key[index + 0] === "M") {
//                 if (key[index + 1] === "E") {
//                   if (key[index + 2] === "T") {
//                     if (key[index + 3] === "A") {
//                       infix = infix + "META";
//                       index = index + 4;
//                       while (index < key.length) {
//                         infix = infix + key[index]
//                         index = index + 1;
//                       }
//                       key = prefix;
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }

const restore = () => ARAN.build.If(
  ARAN.build.binary(
    "===",
    ARAN.build.get(
      ARAN.build.read("key"),
      ARAN.build.primitive(0)),
    ARAN.build.primitive("$")),
  ARAN.build.If(
    ARAN.build.binary(
      "===",
      ARAN.build.get(
        ARAN.build.read("key"),
        ARAN.build.primitive(1)),
      ARAN.build.primitive("$")),
    ArrayLite.concat(
      ARAN.build.Declare(
        "var",
        "index",
        ARAN.build.primitive(2)),
      ARAN.build.Declare(
        "var",
        "infix",
        ARAN.build.primitive("")),
      ARAN.build.While(
        ARAN.build.binary(
          "===",
          ARAN.build.get(
            ARAN.build.read("key"),
            ARAN.build.primitive("index")),
          ARAN.build.primitive("$")),
        ArrayLite.concat(
          ARAN.build.Statement(
            ARAN.build.write(
              "infix",
              ARAN.build.binary(
                "+",
                ARAN.build.read("infix"),
                ARAN.build.primitive("$")))),
          ARAN.build.Statement(
            ARAN.build.write(
              "index",
              ARAN.build.binary(
                "+",
                ARAN.build.read("index"),
                ARAN.build.primitive(1)))))),
      ARAN.build.Declare(
        "var",
        "prefix",
        ARAN.build.binary(
          "+",
          ARAN.build.primitive("$$"),
          ARAN.build.read("infix"))),
      ArrayLite.reduce(
        ["error", "completion", "arguments", "callee", "eval"],
        (statements, string, index) => ARAN.build.If(
          ARAN.build.binary(
            "===",
            ARAN.build.read("key"),
            ARAN.build.binary(
              "+",
              ARAN.build.read("prefix"),
              ARAN.build.primitive(string))),
          ARAN.build.Statement(
            ARAN.build.write(
              "key",
              ARAN.build.binary(
                "+",
                ARAN.build.read("infix"),
                ARAN.build.primitive(string)))),
          statements),
        ArrayLite.reduce(
          ARAN.namespace,
          (statements, string, index) => ARAN.build.If(
            ARAN.build.binary(
              "===",
              ARAN.build.get(
                ARAN.build.read("key"),
                ARAN.build.binary(
                  "+",
                  ARAN.build.read("index"),
                  ARAN.build.primitive(index))),
              ARAN.build.primitive(string)),
            statements,
            []),
          ArrayLite.concat(
            ARAN.build.Statement(
              ARAN.build.write(
                "infix",
                ARAN.build.binary(
                  "+",
                  ARAN.build.read("infix"),
                  ARAN.build.primitive(ARAN.namespace)))),
            ARAN.build.Statement(
              ARAN.build.write(
                "index",
                ARAN.build.binary(
                  "+",
                  ARAN.build.read("index"),
                  ARAN.build.primitive(ARAN.namespace.length)))),
            ARAN.build.While(
              ARAN.build.binary(
                "<",
                ARAN.build.read("index"),
                ARAN.build.get(
                  ARAN.build.read("key"),
                  ARAN.build.primitive("length"))),
              ArrayLite.concat(
                ARAN.build.Statement(
                  ARAN.build.write(
                    "infix",
                    ARAN.build.binary(
                      "+",
                      ARAN.build.read("infix"),
                      ARAN.build.get(
                        ARAN.build.read("key"),
                        ARAN.build.read("index"))))),
                ARAN.build.Statement(
                  ARAN.build.write(
                    "index",
                    ARAN.build.binary(
                      "+",
                      ARAN.build.read("index"),
                      ARAN.build.primitive(1)))))),
            ARAN.build.Statement(
              ARAN.build.write(
                "key",
                ARAN.build.read("infix"))))))),
    []),
  []);
