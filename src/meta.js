
const ArrayLite = require("array-lite");

exports.trigger = (string, expressions) => ARAN.build.invoke(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive(string),
  expressions);

exports.apply = (expression1, expression2, expressions) => ARAN.build.apply(
  ARAN.build.get(
    ARAN.build.read("META"),
    ARAN.build.primitive("APPLY")),
  [
    expression1,
    expression2,
    ARAN.build.array(expressions)]);

exports.eval = () => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("EVAL"));

exports.load = (string) => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("GLOBAL_" + string));

exports.save = (string, expression) => ARAN.build.set(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("GLOBAL_"+string),
  expression);

exports.gproxy = (strict) => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("GLOBAL")),
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive(
        strict ? "GSHANDLERS" : "GHANDLERS"))]);

exports.wproxy = (expression) => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    expression,
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("WHANDLERS"))]);

exports.Sandbox = (strict, statements) => ARAN.build.Statement(
  ARAN.build.write(
    "completion",
    ARAN.build.apply(
      ARAN.build.get(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive("APPLY")),
      [
        ARAN.build.function(
          false,
          ARAN.build.With(
            ARAN.build.construct(
              ARAN.build.get(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("PROXY")),
              [
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("GLOBAL")),
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive(strict ? "GSHANDLERS" : "GHANDLERS"))]),
            ArrayLite.concat(
              ARAN.build.Declare(
                "const",
                ARAN.namespace,
                ARAN.build.read("this")),
              ARAN.build.Declare(
                "const",
                "eval",
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("EVAL"))),
              ARAN.build.Declare(
                "let",
                "completion",
                ARAN.build.primitive(void 0)),
              (
                strict ?
                ARAN.build.apply(
                  ARAN.build.function(true, statements),
                  []) :
                statements),
              ARAN.build.Return(
                ARAN.build.read("completion"))))),
        ARAN.build.read(ARAN.namespace),
        ARAN.build.array([])])));

exports.define = (expression1, string, expression2, boolean1, boolean2, boolean3) => ARAN.build.apply(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("DEFINE")),
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
      ArrayLite.concat(
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
            "DEFINE",
            ARAN.build.get(
              ARAN.build.read("Object"),
              ARAN.build.primitive("defineProperty"))],
          [
            "APPLY",
            ARAN.build.get(
              ARAN.build.read("Reflect"),
              ARAN.build.primitive("apply"))],
          [
            "RERROR",
            ARAN.build.read("ReferenceError")],
          [
            "WHANDLERS",
            whandlers()]],
        (
          ARAN.sandbox ?
          [
            [
              "GHANDLERS",
              ARAN.build.object([
                [
                  ARAN.build.primitive("has"),
                  ghandlers.has()],
                [
                  ARAN.build.primitive("deleteProperty"),
                  ghandlers.deleteProperty()],
                [
                  ARAN.build.primitive("get"),
                  ghandlers.get()],
                [
                  ARAN.build.primitive("set"),
                  ghandlers.set()]])],
            [
              "GSHANDLERS",
              ARAN.build.object([
                [
                  ARAN.build.primitive("has"),
                  ghandlers.has()],
                [
                  ARAN.build.primitive("deleteProperty"),
                  ghandlers.deleteProperty()],
                [
                  ARAN.build.primitive("get"),
                  ghandlers.get()],
                [
                  ARAN.build.primitive("set"),
                  ghandlers.setstrict()]])]] :
          [])),
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
    (
      ((statements) => ARAN.sandbox ? exports.Sandbox(false, statements) : statements)
      (
        ARAN.cut.$Program(
          ArrayLite.concat(
            ArrayLite.flatenMap(
              ["global", "TypeError", "eval"],
              (string) => ARAN.build.Statement(
                ARAN.cut.$save(
                  string,
                  ARAN.cut.read(string)))),
            ArrayLite.flatenMap(
              [
                ["Reflect", "apply"],
                ["Object", "defineProperty"],
                ["Object", "getPrototypeOf"],
                ["Object", "keys"],
                ["Symbol", "iterator"]],
              (strings) => ARAN.build.Statement(
                ARAN.cut.$save(
                  strings[0] + "_" + strings[1],
                  ARAN.cut.get(
                    ARAN.cut.read(strings[0]),
                    ARAN.cut.primitive(strings[1])))))))))));

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

/////////////////////
// Global Handlers //
/////////////////////

// ({
//   has: (target, key) => true,
//   deleteProperty (target, key) {
//     RESTORE
//     return delete target[key];
//   },
//   get: (target, key, receiver) => {
//     if (typeof key === "symbol")
//       return void 0;
//     if (key === "eval")
//       return META.EVAL;
//     RESTORE
//     if (key in target)
//       return target[key];
//     throw new META.RERROR(key+" is not defined");
//   },
//   set_strict: (target, key, value, receiver) => {
//     RESTORE
//     if (key in target)
//       target[key] = value;
//     else
//       throw new META.RERROR(key+" is not defined");
//   }
//   set: (target, key, value, receiver) => {
//     RESTORE
//     target[key] = value;
//   }
// })

const ghandlers = {
  "has": () => ARAN.build.arrow(
    ["target", "key"],
    ARAN.build.Return(
      ARAN.build.primitive(true))),
  "deleteProperty": () => ARAN.build.arrow(
    ["target", "key"],
    ArrayLite.concat(
      restore(),
      ARAN.build.Return(
        ARAN.build.delete(
          ARAN.build.read("target"),
          ARAN.build.read("key"))))),
  "get": () => ARAN.build.arrow(
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
      ARAN.build.If(
        ARAN.build.binary(
          "===",
          ARAN.build.read("key"),
          ARAN.build.primitive("eval")),
        ARAN.build.Return(
          ARAN.build.get(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("EVAL"))),
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
              ARAN.build.primitive(" is not defined"))])))),
  "setstrict": () => ARAN.build.arrow(
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
                ARAN.build.primitive(" is not defined"))]))))),
  "set": () => ARAN.build.arrow(
    ["target", "key", "value", "receiver"],
    ArrayLite.concat(
      restore(),
      ARAN.build.Statement(
        ARAN.build.set(
          ARAN.build.read("target"),
          ARAN.build.read("key"),
          ARAN.build.read("value")))))
};

// const ghandlers = () => ARAN.build.object([
//   [
//     ARAN.build.primitive("has"),
//     ],
//   [
//     ARAN.build.primitive("deleteProperty"),
//     ],
//   [
//     ARAN.build.primitive("get"),
// ],
//     [
//       ARAN.build.primitive("set"),
//       ARAN.build.arrow(
//         ["target", "key", "value", "receiver"],
//         ArrayLite.concat(
//           restore(),
//           ARAN.build.If(
//             ARAN.build.get(
//               ARAN.build.read(ARAN.namespace),
//               ARAN.build.primitive("DECLARATION")),
//             ARAN.build.If(
//               ARAN.build.binary(
//                 "in",
//                 ARAN.build.read("key"),
//                 ARAN.build.read("target")),
//               ARAN.build.Statement(
//                 ARAN.build.set(
//                   ARAN.build.read("target"),
//                   ARAN.build.read("key"),
//                   ARAN.build.read("value"))),
//               ARAN.build.Statement(
//                 ARAN.build.invoke(
//                   ARAN.build.read(ARAN.namespace),
//                   ARAN.build.primitive("DEFINE"),
//                   [
//                     ARAN.build.read("target"),
//                     ARAN.build.read("key"),
//                     ARAN.build.object(
//                       [
//                         [
//                           ARAN.build.primitive("value"),
//                           ARAN.build.read("value")],
//                         [
//                           ARAN.build.primitive("writable"),
//                           ARAN.build.primitive(true)],
//                         [
//                           ARAN.build.primitive("enumerable"),
//                           ARAN.build.primitive(true)],
//                         [
//                           ARAN.build.primitive("configurable"),
//                           ARAN.build.primitive(false)]])]))),
//             ArrayLite.concat(
//               ARAN.build.Statement(
//                 ARAN.build.set(
//                   ARAN.build.read(ARAN.namespace),
//                   ARAN.build.primitive("DECLARATION"),
//                   ARAN.build.primitive(true))),
//               ARAN.build.If(
//                 ARAN.build.binary(
//                   "in",
//                   ARAN.build.read("key"),
//                   ARAN.build.read("target")),
//                 ARAN.build.Statement(
//                   ARAN.build.set(
//                     ARAN.build.read("target"),
//                     ARAN.build.read("key"),
//                     ARAN.build.read("value"))),
//                 ARAN.build.Throw(
//                   ARAN.build.construct(
//                     ARAN.build.get(
//                       ARAN.build.read(ARAN.namespace),
//                       ARAN.build.primitive("RERROR")),
//                     [
//                       ARAN.build.binary(
//                         "+",
//                         ARAN.build.read("key"),
//                         ARAN.build.primitive(" is not defined"))])))))))]]);

///////////////////
// With Handlers //
///////////////////

// ({
//   has: (target, key) {
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
//   deleteProperty () {
//     RESTORE
//     return delete target[key];
//   },
//   get: function () {
//     if (key === META.UNSCOPABLES)
//       return target[key];
//     RESTORE
//     return target[key];
//   },
//   set: function () {
//     RESTORE
//     target[key] = value;
//   }
// });

const whandlers = () => ARAN.build.object([
  [
    ARAN.build.primitive("has"),
    ARAN.build.arrow(
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
    ARAN.build.primitive("deleteProperty"),
    ARAN.build.arrow(
      ["target", "key"],
      ArrayLite.concat(
        restore(),
        ARAN.build.Return(
          ARAN.build.delete(
            ARAN.build.read("target"),
            ARAN.build.read("key")))))],
  [
    ARAN.build.primitive("get"),
    ARAN.build.arrow(
      ["target", "key", "receiver"],
      ArrayLite.concat(
        ARAN.build.If(
          ARAN.build.binary(
            "===",
            ARAN.build.read("key"),
            ARAN.build.get(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("UNSCOPABLES"))),
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
      ["target", "key", "value", "receiver"],
      ArrayLite.concat(
        restore(),
        ARAN.build.Statement(
          ARAN.build.set(
            ARAN.build.read("target"),
            ARAN.build.read("key"),
            ARAN.build.read("value")))))]]);
