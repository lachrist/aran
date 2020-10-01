
const Syntax = require("./syntax.js");
const ArrayLite = require("array-lite");
const Normalize = require("./normalize");
const Instrument = require("./instrument.js");
const Generate = require("./generate.js");

const global_eval = global.eval;
const global_Object_freeze = global.Object.freeze;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_split = global.String.prototype.split;
const global_Array_prototype_join = global.Array.prototype.join;
const global_Object_assign = global.Object.assign;
const global_WeakMap = global.WeakMap;

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
      prototype["builtin-names"],
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
      prototype["unary-operators"],
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
      prototype["binary-operators"],
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
  if (typeof serial === "number") {
    if (serial !== serial) {
      throw new global_Error("serial is NaN");
    }
    if (global_Math_round(serial) !== serial) {
      throw new global_Error("serial should be an integer");
    }
    if (serial < 0) {
      throw new global_Error("serial should be a positive integer");
    }
    if (serial >= this.node.length) {
      throw new global_Error("serial is too large for the current node database.");
    }
    if (!(serial in evals)) {
      throw new global_Error("serial does not refer to a node representing a direct eval call");
    }
  } else if (serial !== null) {
    throw new global_Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
  }
  const serials = new global_WeakMap();
  const block1 = Normalize(serial, estree1, {
    __proto__: null,
    evals: this.evals,
    scopes: this.scopes,
    serials: serials
  });
  const block2 = Instrument(block1, {
    __proto__: null,
    eval: serial !== null,
    serials: serials,
    pointcut: pointcut,
    variable: this["advice-variable"]
  });
  const estree2 = Generate(block2, {
    __proto__: null,
    eval: serial !== null,
    variable: this["builtin-variable"]
  });
  return estree2;
};

// Freeze //

global_Object_freeze(prototype);

// Creation //

const check = (name, identifier) => {
  if (!Syntax.identifier(identifier)) {
    throw new global_Error(name + "-identifier should be a valid JavaScript identifier");
  }
  let string = null;
  try {
    string = Identifier.Show(identifier);
  } catch (error) {}
  if (string !== null) {
    throw new global_Error(name + "-identifier may clash with an aran-generated identifier which is represented as: " + string);
  }
};

module.exports = function Aran (options) {
  options = global_Object_assign({
    __proto__: null,
    "builtin-identifier": "BUILTIN",
    "advice-identifier": "ADVICE"
  }, options);
  check("builtin", options["builtin-identifier"]);
  check("advice", options["advice-identifier"]);
  return {
    __proto__: prototype,
    ["builtin-identifier"]: options["builtin-identifier"],
    ["advice-identifier"]: options["advice-identifier"],
    evals: {__proto__: null},
    nodes: [],
  };
};
