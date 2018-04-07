
const ArrayLite = require("array-lite");

exports.trigger = (string, expressions) => ARAN.build.invoke(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive(string),
  expressions);

exports.apply = (expression1, expression2, expressions) => ARAN.build.apply(
  null,
  ARAN.build.get(
    ARAN.build.read("META"),
    ARAN.build.primitive("REFLECT_APPLY")),
  [
    expression1,
    expression2,
    ARAN.build.array(expressions)]);

exports.eval = () => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("EVAL"));

exports.load = (string) => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive(string === "global" ? "GLOBAL" : "GLOBAL_" + string));

exports.save = (string, expression) => ARAN.build.set(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("GLOBAL_"+string),
  expression);

exports.proxy = (string, expression) => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    expression,
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive(string))]);

exports.define = (expression1, string, expression2, boolean1, boolean2, boolean3) => ARAN.build.apply(
  null,
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
            ARAN.build.primitive("value"),
            expression2]],
        (
          boolean1 ?
          [
            [
              ARAN.build.primitive("writable"),
              ARAN.build.primitive(true)]] :
          []),
        (
          boolean2 ?
          [
            [
              ARAN.build.primitive("enumerable"),
              ARAN.build.primitive(true)]] :
          []),
        (
          boolean3 ?
          [
            [
              ARAN.build.primitive("configurable"),
              ARAN.build.primitive(true)]] :
          [])))]);

exports.SETUP = () => ARAN.build.PROGRAM(
  false,
  ArrayLite.concat(
    ArrayLite.flatenMap(
      [
        [
          "EVAL",
          ARAN.build.read("eval")],
        [
          "GLOBAL",
          ARAN.build.invoke(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("EVAL"),
            [
              ARAN.build.primitive("this")])],
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
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive("LOCAL_HANDLERS"),
        ARAN.build.object(
          [
            [
              ARAN.build.primitive("has"),
              ARAN.build.arrow(
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
              ARAN.build.primitive("get"),
              ARAN.build.arrow(
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
              ARAN.build.primitive("set"),
              ARAN.build.arrow(
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
              ARAN.build.primitive("deleteProperty"),
              ARAN.build.arrow(
                false,
                ["target", "key"],
                ArrayLite.concat(
                  restore(),
                  ARAN.build.Return(
                    ARAN.build.delete(
                      ARAN.build.read("target"),
                      ARAN.build.read("key")))))]]))),
    (
      ARAN.sandbox ?
      ARAN.build.Statement(
        ARAN.build.set(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive("GLOBAL_HANDLERS"),
          ARAN.build.object([
            [
              ARAN.build.primitive("has"),
              ARAN.build.arrow(
                false,
                ["target", "key"],
                ARAN.build.Return(
                  ARAN.build.primitive(true)))],
            [
              ARAN.build.primitive("get"),
              ARAN.build.arrow(
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
                        ARAN.build.primitive("RERROR")),
                      [
                        ARAN.build.binary(
                          "+",
                          ARAN.build.read("key"),
                          ARAN.build.primitive(" is not defined"))]))))],
            [
              ARAN.build.primitive("set"),
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("LOCAL_HANDLERS")),
                ARAN.build.primitive("set"))],
            [
              ARAN.build.primitive("deleteProperty"),
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("LOCAL_HANDLERS")),
                ARAN.build.primitive("deleteProperty"))]]))) :
      []),
    (
      ARAN.sandbox ?
      ARAN.build.Statement(
        ARAN.build.set(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive("GLOBAL_STRICT_HANDLERS"),
          ARAN.build.object(
            [
              [
                ARAN.build.primitive("has"),
                ARAN.build.get(
                  ARAN.build.get(
                    ARAN.build.read(ARAN.namespace),
                    ARAN.build.primitive("GLOBAL_HANDLERS")),
                  ARAN.build.primitive("has"))],
              [
                ARAN.build.primitive("get"),
                ARAN.build.get(
                  ARAN.build.get(
                    ARAN.build.read(ARAN.namespace),
                    ARAN.build.primitive("GLOBAL_HANDLERS")),
                  ARAN.build.primitive("get"))],
              [
                ARAN.build.primitive("set"),
                ARAN.build.arrow(
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
                            ARAN.build.primitive("RERROR")),
                          [
                            ARAN.build.binary(
                              "+",
                              ARAN.build.read("key"),
                              ARAN.build.primitive(" is not defined"))])))))],
              [
                ARAN.build.primitive("deleteProperty"),
                ARAN.build.get(
                  ARAN.build.get(
                    ARAN.build.read(ARAN.namespace),
                    ARAN.build.primitive("GLOBAL_HANDLERS")),
                  ARAN.build.primitive("deleteProperty"))]]))) :
      []),
    ArrayLite.flatenMap(
      ["TypeError", "eval"],
      (string) => ARAN.build.Statement(
        ARAN.cut.$save(
          string,
          ARAN.cut.get(
            ARAN.cut.$load("global"),
            ARAN.cut.primitive(string))))),
    ArrayLite.flatenMap(
      [
        ["Reflect", "apply"],
        ["Object", "defineProperty"],
        ["Object", "getPrototypeOf"],
        ["Object", "keys"],
        ["Symbol", "iterator"]],
      (strings) => ARAN.build.Statement(
        ARAN.cut.$save(
          strings[0] + "." + strings[1],
          ARAN.cut.conditional(
            ARAN.cut.get(
              ARAN.cut.$load("global"),
              ARAN.cut.primitive(strings[0])),
            ARAN.cut.get(
              ARAN.cut.get(
                ARAN.cut.$load("global"),
                ARAN.cut.primitive(strings[0])),
              ARAN.cut.primitive(strings[1])),
            ARAN.cut.primitive(void 0))))),
    (
      ARAN.sandbox ?
      [] :
      ARAN.build.Statement(
        ARAN.cut.$drop(
          ARAN.cut.set(
            ARAN.cut.$load("global"),
            ARAN.cut.primitive("$$eval"),
            ARAN.cut.$load("eval")))))));

// META.LOCAL_HANDLERS = {
//   has: (target, key) => {
//     if (key === "$$this")
//       return false;
//     if (key === "$newtarget")
//       return false;
//     if (key === "error")
//       return false;
//     if (key === "arguments")
//       return false;
//     if (key === "completion")
//       return false;
//     if (key[0] !== "M")
//       return false;
//     if (key[1] !== "E")
//       return false;
//     if (key[2] !== "T")
//       return false;
//     if (key[3] !== "A")
//       return false;
//     RESTORE
//     return key in target;
//   },
//   get: (target, key, receiver) => {
//     if (typeof target === "symbol")
//       return target[key];
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

// META.GLOBAL_HANDLERS = {
//   has: (target, key) => {
//     return true;
//   },
//   get: (target, key, receiver) => {
//     if (typeof key === "symbol")
//       return void 0;
//     RESTORE
//     if (key in target)
//       return target[key];
//     throw new META.RERROR(key+" is not defined");
//   },
//   set: META.LOCAL_HANDLERS.set,
//   deleteProperty: META.LOCAL_HANDLERS.deleteProeperty
// };

// META.GLOBAL_STRICT_HANDLERS = {
//   has: META.GLOBAL_HANDLERS.has,
//   get: META.GLOBAL_HANDLERS.get,
//   set: (target, key, value, receiver) => {
//     RESTORE
//     if (key in target)
//       target[key] = value;
//     else
//       throw new META.RERROR(key+" is not defined");
//   },
//   deleteProperty: META.GLOBAL_HANDLERS.deleteProperty
// };

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
