"use strict";

const global_JSON_stringify = global.JSON.stringify;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_split = global.String.prototype.split;
const global_RegExp_prototype_exec = global.RegExp.prototype.exec;
const global_String_prototype_replace = global.String.prototype.replace;
const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const Fs = require("fs");
const Path = require("path");
const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const Astring = require("astring");

const dictionnary = {__proto__: null};

const builtin_name_array = [
  // Special //
  "#globalObject",
  "#globalLexicalFrame",
  "#globalVariableNames",
  // Grabbable //
  "Object", // Convertion inside destructuring pattern + super
  "Reflect.defineProperty", // Proxy Arguments trap :(
  "global",
  "eval",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Function.prototype.arguments@get",
  "Function.prototype.arguments@set",
  "Array.prototype.values",
  "Object.prototype",
  // Convertion //
  // Object
  "Array.from",
  // Construction //
  "Object.create",
  "Array.of",
  "Array",
  "Proxy",
  "RegExp",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  // Readers //
  "Reflect.get",
  "Reflect.has",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.getPrototypeOf",
  "Reflect.ownKeys",
  "Reflect.isExtensible",
  "Object.keys",
  "Array.prototype.concat",
  "Array.prototype.includes",
  "Array.prototype.slice",
  // Writers //
  "Reflect.set",
  "Reflect.deleteProperty",
  "Reflect.setPrototypeOf",
  // "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor",
  "Reflect.preventExtensions",
  "Object.assign",
  "Object.freeze",
  "Object.defineProperty",
  "Object.setPrototypeOf",
  "Object.preventExtensions",
  "Array.prototype.fill",
  "Array.prototype.push"];

const sepecial_builtin_mapping = {
  "#globalObject": `((new Function("return this;"))())`,
  "#globalLexicalFrame": `{__proto__:null}`,
  "#globalVariableNames": `[]`};

const binary_operator_array = [
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof"];

const unary_operator_array = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"];

const parse = (code) => {
  const estree = Acorn.parse(code, {__proto__:null, ecmaVersion:2020});
  const array = [estree];
  let length = 1;
  while (length > 0) {
    const element = array[--length];
    if (typeof element === "object" && element !== null) {
      if (global_Reflect_getOwnPropertyDescriptor(element, "start")) {
        delete element.start;
      }
      if (global_Reflect_getOwnPropertyDescriptor(element, "end")) {
        delete element.end;
      }
      const keys = global_Reflect_ownKeys(element);
      for (let index = 0; index < keys.length; index++) {
        array[length++] = element[keys[index]];
      }
    }
  }
  return estree;
}

const generate = (estree) => Astring.generate(estree);

/////////////
// Builtin //
/////////////
dictionnary.__BUILTIN_NAMES__ = global_JSON_stringify(builtin_name_array, null, 2);
dictionnary.__BUILTIN_OBJECT__ = `({
  __proto__: null,
  ${ArrayLite.join(
    ArrayLite.map(
      builtin_name_array,
      (name, _parts) => `[${global_JSON_stringify(name)}]: ${(
        name[0] === "#" ?
        special_builtin_mapping[name] :
        (
          _parts = global_Reflect_apply(global_String_prototype_split, name, ["."]),
          ArrayLite.reduce(
            ArrayLite.slice(_parts, 1, _parts.length),
            (script, part, _parts) => (
              _parts = global_Reflect_apply(global_RegExp_prototype_exec, /^([^\@]+)\@([a-z]+)$/, [part]),
              (
                _parts === null ?
                `${script}[${global_JSON_stringify(part)}]` :
                `Reflect.getOwnPropertyDescriptor(${script}, ${global_JSON_stringify(_parts[1])}).${_parts[2]}`)),
            _parts[0])))}`),
    ",\n")}})`;
dictionnary.__BUILTIN_SCRIPT__ = global_JSON_stringify(dictionnary.__BUILTIN_OBJECT__ + ";");
dictionnary.__BUILTIN_ESTREE__ = global_JSON_stringify(
  parse(
    dictionnary.__BUILTIN_OBJECT__ + ";"),
  null,
  2);

////////////
// Binary //
////////////
dictionnary.__BINARY_OPERATORS__ = global_JSON_stringify(binary_operator_array, null, 2);
dictionnary.__BINARY_CLOSURE__ = `
  ((operator, argument1, argument2) => {
    switch (operator) {
      ${ArrayLite.join(
        ArrayLite.map(
          binary_operator_array,
          (operator) => `      case ${global_JSON_stringify(operator)}: return argument1 ${operator} argument2;`),
        "\n")}}
    throw "invalid binary operator";})`;
dictionnary.__BINARY_SCRIPT__ = global_JSON_stringify(dictionnary.__BINARY_CLOSURE__ + ";");
dictionnary.__BINARY_ESTREE__ = global_JSON_stringify(
  parse(
    dictionnary.__BINARY_CLOSURE__ + ";"),
  null,
  2);

///////////
// Unary //
///////////
dictionnary.__UNARY_OPERATORS__ = global_JSON_stringify(unary_operator_array, null, 2);
dictionnary.__UNARY_CLOSURE__ = `
  ((operator, argument) => {
    switch (operator) {
      ${ArrayLite.join(
        ArrayLite.map(
          unary_operator_array,
          (operator) => (
            operator === "delete" ?
            `    case "delete": return true;` :
            `    case ${global_JSON_stringify(operator)}: return ${operator} argument;`)),
        "\n")}}
    throw "invalid unary operator";})`;
dictionnary.__UNARY_SCRIPT__ = global_JSON_stringify(dictionnary.__UNARY_CLOSURE__ + ";");
dictionnary.__UNARY_ESTREE__ = global_JSON_stringify(
  parse(
    dictionnary.__UNARY_CLOSURE__ + ";"),
  null,
  2);

////////////
// Object //
////////////
dictionnary.__OBJECT_CLOSURE__ = `
  ((prototype, entries) => {
    const object = {__proto__: null};
    for (let index = 0; index < entries.length; index ++) {
      object[entries[index][0]] = entries[index][1];}
    return prototype === null ? object : Object.assign({__proto__:prototype}, object);})`;
dictionnary.__OBJECT_SCRIPT__ = global_JSON_stringify(dictionnary.__OBJECT_CLOSURE__ + ";");
dictionnary.__OBJECT_ESTREE__ = global_JSON_stringify(
  parse(
    dictionnary.__OBJECT_CLOSURE__ + ";"),
  null,
  2);

/////////
// End //
/////////
Fs.writeFileSync(
  Path.join(__dirname, "index.js"),
  generate(
    parse(
      global_Reflect_apply(
        global_String_prototype_replace,
        Fs.readFileSync(
          Path.join(__dirname, "index.template.js"),
          "utf8"),
        [
          /__([A-Z]+)_([A-Z]+)__/g,
          (key) => dictionnary[key]]))),
  "utf8");