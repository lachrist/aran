
const Syntax = require("./lib/syntax.js");
const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const Fs = require("fs");
const Path = require("path");

const global_JSON_Stringify = global.JSON.stringify;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const builtins = (
  "{\n" +
  "  __proto__: null,\n" +
  ArrayLite.join(
    ArrayLite.map(
      Syntax["builtin-name"],
      (name) => (
        name === "global" ?
        "  \"global\": (new Function(\"return this\"))()," :
        "  \"" + name + "\": " + name + ",")),
    "\n") + "\n" +
  "}");

const unary = (
  "(operator, argument) => {\n" +
  "  switch (operator) {\n" +
  ArrayLite.join(
    ArrayLite.map(
      Syntax["unary-operator"],
      (operator) => "    case \"" + operator + "\": return " + operator + " argument;"),
    "\n") + "\n" +
  "  }\n" +
  "  return void 0;\n" +
  "}");

const binary = (
  "(operator, argument1, argument2) => {\n" +
  "  switch (operator) {\n" +
  ArrayLite.join(
    ArrayLite.map(
      Syntax["binary-operator"],
      (operator) => "    case \"" + operator + "\": return argument1 " + operator + " argument2;"),
    "\n") + "\n" +
  "  }\n" +
  "  return void 0;\n" +
  "}");

const object = (
  "(prototype, bindings) => {\n" +
  "  const object = {__proto__: null};\n" +
  "  for (let index = 0; index < bindings.length; index ++) {\n" +
  "    object[bindings[0]] = bindings[1];\n" +
  "  }\n" +
  "  return object;\n" +
  "}");

const estree = (script) => {
  const object = Acorn.parseExpressionAt(script, 0)
  const objects = [object];
  while (objects.length) {
    const object = objects[objects.length - 1];
    objects.length--;
    if (global_Reflect_getOwnPropertyDescriptor(object, "type")) {
      delete object.start;
      delete object.end;
    }
    const keys = global_Reflect_ownKeys(object);
    for (let index = 0; index < keys.length; index++) {
      if (typeof object[keys[index]] === "object" && object[keys[index]] !== null) {
        objects[objects.length] = object[keys[index]];
      }
    }
  }
  return JSON.stringify(object, null, 2);
};

Fs.writeFileSync(
  Path.join(__dirname, "lib", "live2.js"),
  (
    "exports.builtins = " + builtins + ";\n\n" +
    "exports.unary = " + unary + ";\n\n" +
    "exports.binary = " + binary + ";\n\n" +
    "exports.object = " + object + ";\n\n"),
  "utf8");

Fs.writeFileSync(
  Path.join(__dirname, "lib", "dead.js"),
  (
    "exports.builtins = " + estree(builtins) + "\n\n" +
    "exports.unary = " + estree(unary) + "\n\n" +
    "exports.binary = " + estree(binary) + "\n\n" +
    "exports.object = " + estree(object) + "\n\n"),
  "utf8");
