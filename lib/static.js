
const ArrayLite = require("array-lite");
const Reflect_apply = Reflect.apply;
const String_prototype_split = String.prototype.split;

const keyof = (name) => {
  const key = "";
  for (let index = 0; index < name.length; index++)
    key += name[index] === "." ? "_" : name[index];
  return "_"+key;
};

const regular1s = [
  "eval",
  "Proxy",
  "ReferenceError",
  "TypeError"
];

const regular2s = [
  "Symbol.iterator",
  "Reflect.apply",
  "Reflect.set",
  "Object.defineProperty",
  "Object.getPrototypeOf",
  "Object.keys"
];

const names = AraryLite.concat(
  regular1s,
  regular2s,
  [
    "global",
    "WithHandlers",
    "SandboxHandlers",
    "StrictSandboxHandlers",
    "StrictSet"]);

exports.load = (name) => {
  if (!ArrayLite.includes(names, name))
    throw new Error("Invalid name: "+name);
  return ARAN.build.get(
    ARAN.build.read(ARAN.namespace),
    ARAN.build.primitive(keyof(name)));
};

// exports.save = (name, expression) => ARAN.build.set(
//   ARAN.build.read(ARAN.namespace),
//   ARAN.build.primitive(keyof(name)),
//   expression);

exports.Setup = () => ARAN.build.If(
  ARAN.build.binary(
    "in",
    ARAN.build.primitive(keyof("global")),
    ARAN.build.read(ARAN.namespace)),
  [],
  ArrayLite.concat(
    // META._global = eval("this");
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive(keyof("global")),
        ARAN.build.apply(
          ARAN.build.read("eval"),
          [
            ARAN.build.primitive("this")]))),
    // META._StrictSet = function callee () {
    //   if (META._Reflect_set(arguments[0], arguments[1], arguments[2], arguments[0])) {
    //     return arguments[2];
    //   } else {
    //     throw new ARAN._TypeError("Cannot set object property");
    //   }
    // };
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive(keyof("StrictSet")),
        ARAN.build.closure(
          ARAN.build.If(
            ARAN.build.invoke(
              ARAN.build.read(ARAN.namespace),
              ARAN.build.primitive(keyof("Reflect.set")),
              [
                ARAN.build.get(
                  ARAN.build.read("arguments"),
                  ARAN.build.primitive(0)),
                ARAN.build.get(
                  ARAN.build.read("arguments"),
                  ARAN.build.primitive(1)),
                ARAN.build.get(
                  ARAN.build.read("arguments"),
                  ARAN.build.primitive(2)),
                ARAN.build.get(
                  ARAN.build.read("arguments")),
                ARAN.build.primitive(0)]),
            ARAN.build.Return(
              ARAN.build.get(
                ARAN.build.read("arguments"),
                ARAN.build.primitive(2))),
            ARAN.build.Throw(
              ARAN.build.construct(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive(keyof("TypeError"))),
                [
                  ARAN.build.primitive("Cannot set object property")])))))),
    // META._WithHandlers = {
    //   has: function callee () {
    //     let target = arguments[0];
    //     let key = arguments[1];
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
    //   get: function callee () {
    //     let target = arguments[0];
    //     let key = arguments[1];
    //     if (typeof target === "symbol") {
    //       return target[key];
    //     }
    //     RESTORE
    //     return target[key];
    //   },
    //   set: function callee () {
    //     let target = arguments[0];
    //     let key = arguments[1];
    //     let value = arguments[2];
    //     RESTORE
    //     target[key] = value;
    //   },
    //   deleteProperty: function () {
    //     let target = arguments[0];
    //     let key = arguments[1];
    //     RESTORE
    //     return delete target[key];
    //   }
    // };
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive(keyof("WithHandlers")),
        ARAN.build.object(
          [
            [
              "has",
              ARAN.build.closure(
                ArrayLite.concat(
                  ARAN.build.Declare(
                    "let",
                    "target",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Declare(
                    "let",
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
                      ARAN.build.read("target")))))],
            [
              "get",
              ARAN.build.closure(
                ArrayLite.concat(
                  ARAN.build.Declare(
                    "let",
                    "target",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Declare(
                    "let",
                    "key",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(1))),
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
              ARAN.build.closure(
                ArrayLite.concat(
                  ARAN.build.Declare(
                    "let",
                    "target",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Declare(
                    "let",
                    "key",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(1))),
                  ARAN.build.Declare(
                    "let",
                    "value",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(2))),
                  restore(),
                  ARAN.build.Statement(
                    ARAN.build.set(
                      ARAN.build.read("target"),
                      ARAN.build.read("key"),
                      ARAN.build.read("value")))))],
            [
              "deleteProperty",
              ARAN.build.closure(
                ArrayLite.concat(
                  ARAN.build.Declare(
                    "let",
                    "target",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Declare(
                    "let",
                    "key",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(1))),
                  restore(),
                  ARAN.build.Return(
                    ARAN.build.delete(
                      ARAN.build.read("target"),
                      ARAN.build.read("key")))))]]))),
    // META._SandboxHandlers = {
    //   has: function callee () {
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
        ARAN.build.primitive(
          keyof("SandboxHandlers")),
        ARAN.build.object([
          [
            "has",
            ARAN.build.closure(
              ARAN.build.Return(
                ARAN.build.primitive(true)))],
          [
            "get",
            ARAN.build.closure(
              ArrayLite.concat(
                  ARAN.build.Declare(
                    "let",
                    "target",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Declare(
                    "let",
                    "key",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(1))),
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
                      ARAN.build.primitive(
                        keyof("ReferenceError"))),
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
                ARAN.build.primitive(
                  keyof("WithHandlers"))),
              ARAN.build.primitive("deleteProperty"))]]))),
    // META._StrictSandboxHandlers = {
    //   has: META._SandboxHandlers.has,
    //   get: META._SandboxHandlers.get,
    //   set: function callee () {
    //     let target = arguments[0];
    //     let key = arguments[1];
    //     let value = arguments[2];
    //     RESTORE
    //     if (key in target) {
    //       target[key] = value;
    //     } else {
    //       throw new META._ReferenceError(key+" is not defined");
    //     }
    //   },
    //   deleteProperty: META._SandboxHandlers.deleteProperty
    // };
    ARAN.build.Statement(
      ARAN.build.set(
        ARAN.build.read(ARAN.namespace),
        ARAN.build.primitive(keyof("StrictSandboxHandlers")),
        ARAN.build.object(
          [
            [
              "has",
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive(
                    keyof("SandboxHandlers"))),
                ARAN.build.primitive("has"))],
            [
              "get",
              ARAN.build.get(
                ARAN.build.get(
                  ARAN.build.read(ARAN.namespace),
                  ARAN.build.primitive(
                    keyof("SandboxHandlers"))),
                ARAN.build.primitive("get"))],
            [
              "set",
              ARAN.build.closure(
                ArrayLite.concat(
                  ARAN.build.Declare(
                    "let",
                    "target",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(0))),
                  ARAN.build.Declare(
                    "let",
                    "key",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(1))),
                  ARAN.build.Declare(
                    "let",
                    "value",
                    ARAN.build.get(
                      ARAN.build.read("arguments"),
                      ARAN.build.primitive(2))),
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
                          ARAN.build.primitive(
                            keyof("ReferenceError"))),
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
                  ARAN.build.primitive(
                    keyof("SandboxHandlers"))),
                ARAN.build.primitive("deleteProperty"))]])))
    // META.__ARAN_eval__ = eval;
    // META.__ARAN_Proxy = Proxy;
    // META.__ARAN_TypeError = TypeError;
    // META.__ARAN_ReferenceError = ReferenceError;
    ArrayLite.flatenMap(
      regular1s,
      (name) => ARAN.build.Statement(
        ARAN.build.set(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive(keyof(name)),
          ARAN.build.read(name)))),
    // META.__ARAN_Symbol_iterator = Symbol.iterator;
    // META.__ARAN_Reflect_apply = Reflect.apply;
    // META.__ARAN_Object_defineProperty = Object.defineProperty;
    // META.__ARAN_Object_getPrototypeOf = Object.getPrototypeOf;
    // META.__ARAN_Object_keys = Object.keys;
    ArrayLite.flatenMap(
      regular2s,
      (name) => ARAN.build.Statement(
        ARAN.build.set(
          ARAN.build.read(ARAN.namespace),
          ARAN.build.primitive(keyof(name)),
          ARAN.build.get(
            ARAN.build.read(Reflect_apply(String_prototype_split, name, ["."])[0]),
            ARAN.build.primitive(Reflect_apply(String_prototype_split, name, ["."])[1])))))));

with(new Proxy({}, {has:(tgt, key) => (console.log(key)} }))

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