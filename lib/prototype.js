
const Syntax = require("./syntax.js");
const ArrayLite = require("array-lite");
global_WeakMap
Normalise
Instrument


const global_eval = global.eval;
const global_Object_freeze = global.Object.freeze;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_split = global.String.prototype.split;
const global_Array_prototype_join = global.Array.prototype.join;

// Data //

const prototype = {
  __proto__: null,
  ["builtin-names"]: Syntax["builtin-name"],
  ["unary-operators"]: Syntax["unary-operator"],
  ["binary-operators"]: Syntax["binary-operator"]
};

// Scripts //

prototype["builtin-script"] = (
  "({\n" +
  "  __proto__: null,\n" +
  ArrayLite.join(
    ArrayLite.map(
      prototype["builtin-name"],
      (name) => (
        name === "global" ?
        "  \"global\": ((new Function(\"return this\"))())," :
        "  \"" + name + "\": " + name + ",")),
    "\n") + "\n" +
  "})");

prototype["unary-script"] = (
  "((operator, argument) => {\n" +
  "  switch (operator) {\n" +
  ArrayLite.join(
    ArrayLite.map(
      prototype["unary-operator"],
      (operator) => "    case \"" + operator + "\": return " + operator + " argument;"),
    "\n") + "\n" +
  "  }\n" +
  "  return void 0;\n" +
  "})");

prototype["binary-script"] = (
  "((operator, argument1, argument2) => {\n" +
  "  switch (operator) {\n" +
  ArrayLite.join(
    ArrayLite.map(
      prototype["binary-operator"],
      (operator) => "    case \"" + operator + "\": return argument1 " + operator + " argument2;"),
    "\n") + "\n" +
  "  }\n" +
  "  return void 0;\n" +
  "})");

prototype["object-script"] = (
  "((prototype, bindings) => {\n" +
  "  const object = {__proto__: null};\n" +
  "  for (let index = 0; index < bindings.length; index ++) {\n" +
  "    object[bindings[0]] = bindings[1];\n" +
  "  }\n" +
  "  return object;\n" +
  "})");

// Estrees //

prototype["builtin-estree"] = ({
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
          prototype["builtin-names"],
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

prototype["builtin-object"] = global_eval(prototype["builtin-script"]);

prototype["unary-function"] = global_eval(prototype["unary-script"]);

prototype["binary-function"] = global_eval(prototype["binary-script"]);

prototype["object-function"] = global_eval(prototype["object-script"]);

// Methods //

prototype["weave"] = function weave (estree1, pointcut, serial) {
  if (serial === void 0) {
    serial = null;
  }
  const serials = new global_WeakMap();
  const block1 = Normalise(estree1, {
    __proto__: null,
    serial: serial,
    evals: this.evals,
    nodes: this.nodes,
    serials: serials 
  });
  const block2 = Instrument(block1, {
    __proto__: null,
    eval: serial !== null,
    serials: serials,
    pointcut: pointcut,
    namespace: this["advice-variable"]
  });
  const estree2 = Generate(block2, {
    __proto__: null,
    eval: serial !== null,
    namespace: this["builtin-variable"]
  });
  return estree2;
};

// Freeze //

global_Object_freeze(prototype);

// Creation //

module.exports = function Aran (options = {__proto__:null}) {
  const variable1 = "advice-namespace" in options ? options["advice-variable"] : "ADVICE";
  const variable2 = "builtin-namespace" in options ? options["builtin-variable"] : "BUILTIN";
  Identifier.Check("advice", variable1);
  Identifier.Check("builtin", variable2);
  return {
    __proto__: prototype,
    ["builtin-variable"]: variable1,
    ["advice-variable"]: variable2,
    evals: {
      __proto__: null
    },
    nodes: [],
  };
};
