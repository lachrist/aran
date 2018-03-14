
const ArrayLite = require("array-lite");

exports.trigger = (string, expressions) => ARAN.build.invoke(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive(string),
  expressions);

exports.builtin = (strings) => ARAN.build.get(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("GLOBAL_" + strings.join("_")));

exports.gproxy = () => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("GLOBAL")),
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("GHANDLERS"))]);

exports.wproxy = (expression) => ARAN.build.construct(
  ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive("PROXY")),
  [
    expression,
    ARAN.build.get(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive("WHANDLERS"))]);

exports.declare = (boolean) => ARAN.build.set(
  ARAN.build.read(ARAN.namespace),
  ARAN.build.primitive("DECLARE"),
  ARAN.build.primitive(boolean));

exports.Setup = () => ArrayLite.flatenMap(
  ArrayLite.concat(
    [
      [
        "GLOBAL",
        ARAN.build.conditional(
          ARAN.build.binary(
            "===",
            ARAN.build.unary(
              "typeof",
              ARAN.build.read("self")),
            ARAN.build.primitive("undefined")),
          ARAN.build.read("global"),
          ARAN.build.read("self"))],
      [
        "EVAL",
        ARAN.build.read("eval")],
      [
        "PROXY",
        ARAN.build.read("Proxy")],
      [
        "REFERENCE_ERROR",
        ARAN.build.read("ReferenceError")],
      [
        "UNSCOPABLES",
        ARAN.build.get(
          ARAN.build.read("Symbol"),
          ARAN.build.primitive("unscopables"))],
      [
        "DEFINE",
        ARAN.build.get(
          ARAN.build.read("Object"),
          ARAN.build.primitive("defineProperty"))],
      [
        "DECLARE",
        ARAN.build.primitive(true)],
      [
        "WHANDLERS",
        whandlers()],
      [
        "GHANDLERS",
        (
          ARAN.nosandbox ?
          ARAN.build.primitive(null) :
          ghandlers())],
      [
        "GLOBAL_global",
        ARAN.build.get(
          ARAN.build.get(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("GLOBAL")),
          ARAN.build.conditional(
            ARAN.build.binary(
              "in",
              ARAN.build.primitive("self"),
              ARAN.build.get(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("GLOBAL"))),
            ARAN.build.primitive("self"),
            ARAN.build.primitive("global")))]],
    ArrayLite.map(
      ["TypeError", "eval"],
      (string) => [
        "GLOBAL_" + string,
        ARAN.build.get(
          ARAN.build.get(
            ARAN.build.read(ARAN.namespace),
            ARAN.build.primitive("GLOBAL")),
          ARAN.build.primitive(string))]),
    ArrayLite.map(
      [
        ["Reflect", "apply"],
        ["Object", "defineProperty"],
        ["Object", "getPrototypeOf"],
        ["Object", "keys"],
        ["Symbol", "iterator"]],
      (strings) => [
        "GLOBAL_" + strings[0] + "_" + strings[1],
        ARAN.build.get(
          ARAN.build.get(
            ARAN.build.get(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("GLOBAL")),
            ARAN.build.primitive(strings[0])),
          ARAN.build.primitive(strings[1]))])),
  // ARAN.build.If(
  //   ARAN.build.unary(
  //     "!",
  //     ARAN.build.binary(
  //       "in",
  //       ARAN.build.primitive(pair[0]),
  //       ARAN.build.read(ARAN.namespace))),
  (pair) => ARAN.build.Statement(
    ARAN.build.set(
      ARAN.build.read(ARAN.namespace),
      ARAN.build.primitive(pair[0]),
      pair[1])));

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
///////./////////////

// ({
//   has: function () {
//     var key = arguments[1];
//     if (key === "META")
//       return false;
//     if (key === "$$META")
//       throw new META.REFERENCE_ERROR("Base layer cannot access META");
//     return true;
//   },
//   deleteProperty () {
//     var key = arguments[1];
//     RESTORE
//     return delete arguments[0][key];
//   },
//   get: function () {
//     var key = arguments[1];
//     if (key === META.UNSCOPABLES)
//       return void 0;
//     if (key === "eval")
//       return META.EVAL;
//     RESTORE
//     if (key in arguments[0])
//       return arguments[0][key];
//     throw new META.REFERENCE_ERROR(key+" is not defined");
//   },
//   set: function () {
//     var key = arguments[1];
//     RESTORE
//     if (META.DECLARE) {
//       if (key in arguments[0]) {
//         arguments[0][key] = arguments[2];
//       } else {
//         META.DEFINE(arguments[0], key, {
//           value: arguments[2],
//           writable: true,
//           enumerable: true,
//           configurable: false
//         });
//       }
//     } else {
//       META.DECLARE = true;
//       if (key in arguments[0]) {
//         arguments[0][key] = arguments[2];
//       } else {
//         throw new META.REFERENCE_ERROR(key+" is not defined");
//       }
//     }
//   }
// });

const ghandlers = () => ARAN.build.object([
  [
    ARAN.build.primitive("has"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
        ARAN.build.If(
          ARAN.build.binary(
            "===",
            ARAN.build.read("key"),
            ARAN.build.primitive(ARAN.namespace)),
          ARAN.build.Return(
            ARAN.build.primitive(false)),
          []),
        ARAN.build.If(
          ARAN.build.binary(
            "===",
            ARAN.build.read("key"),
            ARAN.build.primitive("$$"+ARAN.namespace)),
          ARAN.build.Throw(
            ARAN.build.construct(
              ARAN.build.get(
                ARAN.build.read(ARAN.namespace),
                ARAN.build.primitive("REFERENCE_ERROR")),
              [
                ARAN.build.primitive("Target program is forbidden to access "+ARAN.namespace)])),
          []),
        ARAN.build.Return(
          ARAN.build.primitive(true))))],
  [
    ARAN.build.primitive("deleteProperty"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
        restore(),
        ARAN.build.Return(
          ARAN.build.delete(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0)),
            ARAN.build.read("key")))))],
  [
    ARAN.build.primitive("get"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
        ARAN.build.If(
          ARAN.build.binary(
            "===",
            ARAN.build.read("key"),
            ARAN.build.get(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("UNSCOPABLES"))),
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
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0))),
          ARAN.build.Return(
            ARAN.build.get(
              ARAN.build.get(
                ARAN.build.read("arguments"),
                ARAN.build.primitive(0)),
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
      ARAN.build.primitive("set"),
      ARAN.build.closure(
        false,
        ArrayLite.concat(
          ARAN.build.Declare(
            "var",
            "key",
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(1))),
          restore(),
          ARAN.build.If(
            ARAN.build.get(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("DECLARE")),
            ARAN.build.If(
              ARAN.build.binary(
                "in",
                ARAN.build.read("key"),
                ARAN.build.get(
                  ARAN.build.read("arguments"),
                  ARAN.build.primitive(0))),
              ARAN.build.Statement(
                ARAN.build.set(
                  ARAN.build.get(
                    ARAN.build.read("arguments"),
                    ARAN.build.primitive(0)),
                  ARAN.build.read("key"),
                  ARAN.build.get(
                    ARAN.build.read("arguments"),
                    ARAN.build.primitive(2)))),
              ARAN.build.Statement(
                ARAN.build.invoke(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("DEFINE"),
                  [
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0)),
                    ARAN.build.read("key"),
                    ARAN.build.object(
                      [
                        [
                          ARAN.build.primitive("value"),
                          ARAN.build.get(
                            ARAN.build.read("arguments"),
                            ARAN.build.primitive(2))],
                        [
                          ARAN.build.primitive("writable"),
                          ARAN.build.primitive(true)],
                        [
                          ARAN.build.primitive("enumerable"),
                          ARAN.build.primitive(true)],
                        [
                          ARAN.build.primitive("configurable"),
                          ARAN.build.primitive(false)]])]))),
            ArrayLite.concat(
              ARAN.build.Statement(
                ARAN.build.set(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive("DECLARE"),
                  ARAN.build.primitive(true))),
              ARAN.build.If(
                ARAN.build.binary(
                  "in",
                  ARAN.build.read("key"),
                  ARAN.build.get(
                    ARAN.build.read("arguments"),
                    ARAN.build.primitive(0))),
                ARAN.build.Statement(
                  ARAN.build.set(
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0)),
                    ARAN.build.read("key"),
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(2)))),
                ARAN.build.Throw(
                  ARAN.build.construct(
                    ARAN.build.get(
                      ARAN.build.read(ARAN.namespace),
                      ARAN.build.primitive("REFERENCE_ERROR")),
                    [
                      ARAN.build.binary(
                        "+",
                        ARAN.build.read("key"),
                        ARAN.build.primitive(" is not defined"))])))))))]]);

///////////////////
// With Handlers //
///////////////////

// ({
//   has: function () {
//     var key = arguments[1];
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
//     return key in arguments[0];
//   },
//   deleteProperty () {
//     var key = arguments[1];
//     RESTORE
//     return delete arguments[0][key];
//   },
//   get: function () {
//     var key = arguments[1];
//     if (key === META.UNSCOPABLES)
//       return arguments[0][key];
//     RESTORE
//     return arguments[0][key];
//   },
//   set: function () {
//     var key = arguments[1];
//     RESTORE
//     arguments[0][key] = arguments[2];
//   }
// });

const whandlers = () => ARAN.build.object([
  [
    ARAN.build.primitive("has"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
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
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0))))))],
  [
    ARAN.build.primitive("deleteProperty"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
        restore(),
        ARAN.build.Return(
          ARAN.build.delete(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0)),
            ARAN.build.read("key")))))],
  [
    ARAN.build.primitive("get"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
        ARAN.build.If(
          ARAN.build.binary(
            "===",
            ARAN.build.read("key"),
            ARAN.build.get(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive("UNSCOPABLES"))),
          ARAN.build.Return(
            ARAN.build.get(
              ARAN.build.get(
                ARAN.build.read("arguments"),
                ARAN.build.primitive(0)),
              ARAN.build.read("key"))),
          []),
        restore(),
        ARAN.build.Return(
          ARAN.build.get(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0)),
            ARAN.build.read("key")))))],
  [
    ARAN.build.primitive("set"),
    ARAN.build.closure(
      false,
      ArrayLite.concat(
        ARAN.build.Declare(
          "var",
          "key",
          ARAN.build.get(
            ARAN.build.read("arguments"),
            ARAN.build.primitive(1))),
        restore(),
        ARAN.build.Statement(
          ARAN.build.set(
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(0)),
            ARAN.build.read("key"),
            ARAN.build.get(
              ARAN.build.read("arguments"),
              ARAN.build.primitive(2))))))]]);
