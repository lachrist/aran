
const Syntax = require("./syntax.js");
const ArrayLite = require("array-lite");

const global_eval = global.eval;
const global_Object_freeze = global.Object.freeze;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_split = global.String.prototype.split;
const global_Array_prototype_join = global.Array.prototype.join;

// Data //

module.exports = {
  __proto__: null,
  ["builtin-names"]: Syntax["builtin-name"],
  ["unary-operators"]: Syntax["unary-operator"],
  ["binary-operators"]: Syntax["binary-operator"]
};

// Scripts //

module.exports["builtin-script"] = (
  "({\n" +
  "  __proto__: null,\n" +
  ArrayLite.join(
    ArrayLite.map(
      Syntax["builtin-name"],
      (name) => (
        name === "global" ?
        "  \"global\": ((new Function(\"return this\"))())," :
        "  \"" + name + "\": " + name + ",")),
    "\n") + "\n" +
  "})");

module.exports["unary-script"] = (
  "((operator, argument) => {\n" +
  "  switch (operator) {\n" +
  ArrayLite.join(
    ArrayLite.map(
      Syntax["unary-operator"],
      (operator) => "    case \"" + operator + "\": return " + operator + " argument;"),
    "\n") + "\n" +
  "  }\n" +
  "  return void 0;\n" +
  "})");

module.exports["binary-script"] = (
  "((operator, argument1, argument2) => {\n" +
  "  switch (operator) {\n" +
  ArrayLite.join(
    ArrayLite.map(
      Syntax["binary-operator"],
      (operator) => "    case \"" + operator + "\": return argument1 " + operator + " argument2;"),
    "\n") + "\n" +
  "  }\n" +
  "  return void 0;\n" +
  "})");

module.exports["object-script"] = (
  "((prototype, bindings) => {\n" +
  "  const object = {__proto__: null};\n" +
  "  for (let index = 0; index < bindings.length; index ++) {\n" +
  "    object[bindings[0]] = bindings[1];\n" +
  "  }\n" +
  "  return object;\n" +
  "})");

// Estrees //

module.exports["builtin-estree"] = ({
  type: "ObjectExpression",
  properties: ArrayLite.concat(
    [
      {
        type: "Property",
        kind: "init",
        key: {
          type: "Identifier",
          name: "__proto__"},
        value: {
          type: "Literal",
          value: null}},
      {
        type: "Property",
        kind: "init",
        key: {
          type: "Literal",
          value: "global"},
        value: {
          type: "CallExpression",
          callee: {
            type: "NewExpression",
            callee: {
              type: "Identifier",
              name: "Function"},
            arguments: [
              {
                type: "Literal",
                value: "return this"}]},
          arguments: []}}],
    ArrayLite.map(
      ArrayLite.map(
        ArrayLite.filter(
          module.exports["builtin-names"],
          (name) => (
            name !== "global" &&
            name !== "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get" &&
            name !== "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")),
        (name) => global_Reflect_apply(global_String_prototype_split, name, ["."])),
      (identifiers) => ({
        type: "Property",
        kind: "init",
        key: {
          type: "Literal",
          value: global_Reflect_apply(global_Array_prototype_join, identifiers, ["."])},
        value: ArrayLite.reduce(
          ArrayLite.slice(identifiers, 1, identifiers.length),
          (node, identifier) => ({
            type: "MemberExpression",
            computed: false,
            object: node,
            property: {
              type: "Identifier",
              name: identifier}}),
          {
            type: "Identifier",
            name: identifiers[0]})})),
    ArrayLite.map(
      ["get", "set"],
      (accessor) => ({
        type: "Property",
        kind: "init",
        key: {
          type: "Literal",
          value: "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments')." + accessor},
        value: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              computed: false,
              object: {
                type: "Identifier",
                name: "Reflect"},
              property: {
                type: "Identifier",
                name: "getOwnPropertyDescriptor"}},
            arguments: [
              {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: "Function"},
                property: {
                  type: "Identifier",
                  name: "prototype"}},
              {
                type: "Literal",
                value: "arguments"}]},
          property: {
            type: "Identifier",
            name: accessor}}})))});

// Objects / Functions //

module.exports["builtin-object"] = global_eval(module.exports["builtin-script"]);

module.exports["unary-function"] = global_eval(module.exports["unary-script"]);

module.exports["binary-function"] = global_eval(module.exports["binary-script"]);

module.exports["object-function"] = global_eval(module.exports["object-script"]);

// Freeze //

global_Object_freeze(module.exports);
