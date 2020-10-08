
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
const global_Map = global.Map;

const names = [
  // Informers //
  "enter",
  "leave",
  "success",
  "break",
  "continue",
  "debugger",
  // Producers //
  "primitive",
  "builtin",
  "method",
  "function",
  "read",
  // Consumers //
  "drop",
  "write",
  "failure",
  "test",
  "eval",
  // Combiners //
  "unary",
  "binary",
  "construct",
  "apply",
  "object"
];

// Data //

// const prototype = {
//   ["builtin-names"]: Syntax["builtin-name"],
//   ["unary-operators"]: Syntax["unary-operator"],
//   ["binary-operators"]: Syntax["binary-operator"],
//   transparency: {
//     script:
//     estree:
//
//   }
// };
//
// // Scripts //
//
// prototype["builtin-script"] = (
//   "({\n" +
//   "  __proto__: null,\n" +
//   ArrayLite.join(
//     ArrayLite.map(
//       prototype["builtin-names"],
//       (name) => (
//         name === "global" ?
//         "  \"global\": ((new Function(\"return this\"))())," :
//         "  \"" + name + "\": " + name + ",")),
//     "\n") + "\n" +
//   "})");
//
// prototype["unary-script"] = (
//   "((operator, argument) => {\n" +
//   "  switch (operator) {\n" +
//   ArrayLite.join(
//     ArrayLite.map(
//       prototype["unary-operators"],
//       (operator) => "    case \"" + operator + "\": return " + operator + " argument;"),
//     "\n") + "\n" +
//   "  }\n" +
//   "  return void 0;\n" +
//   "})");
//
// prototype["binary-script"] = (
//   "((operator, argument1, argument2) => {\n" +
//   "  switch (operator) {\n" +
//   ArrayLite.join(
//     ArrayLite.map(
//       prototype["binary-operators"],
//       (operator) => "    case \"" + operator + "\": return argument1 " + operator + " argument2;"),
//     "\n") + "\n" +
//   "  }\n" +
//   "  return void 0;\n" +
//   "})");
//
// prototype["object-script"] = (
//   "((prototype, bindings) => {\n" +
//   "  const object = {__proto__: null};\n" +
//   "  for (let index = 0; index < bindings.length; index ++) {\n" +
//   "    object[bindings[0]] = bindings[1];\n" +
//   "  }\n" +
//   "  return object;\n" +
//   "})");
//
// // Estrees //
//
// prototype["builtin-estree"] = ({
//   type: "ObjectExpression",
//   properties: ArrayLite.concat(
//     [
//       {
//         type: "Property",
//         kind: "init",
//         key: {
//           type: "Identifier",
//           name: "__proto__"},
//         value: {
//           type: "Literal",
//           value: null}},
//       {
//         type: "Property",
//         kind: "init",
//         key: {
//           type: "Literal",
//           value: "global"},
//         value: {
//           type: "CallExpression",
//           callee: {
//             type: "NewExpression",
//             callee: {
//               type: "Identifier",
//               name: "Function"},
//             arguments: [
//               {
//                 type: "Literal",
//                 value: "return this"}]},
//           arguments: []}}],
//     ArrayLite.map(
//       ArrayLite.map(
//         ArrayLite.filter(
//           prototype["builtin-names"],
//           (name) => (
//             name !== "global" &&
//             name !== "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get" &&
//             name !== "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set")),
//         (name) => global_Reflect_apply(global_String_prototype_split, name, ["."])),
//       (identifiers) => ({
//         type: "Property",
//         kind: "init",
//         key: {
//           type: "Literal",
//           value: global_Reflect_apply(global_Array_prototype_join, identifiers, ["."])},
//         value: ArrayLite.reduce(
//           ArrayLite.slice(identifiers, 1, identifiers.length),
//           (node, identifier) => ({
//             type: "MemberExpression",
//             computed: false,
//             object: node,
//             property: {
//               type: "Identifier",
//               name: identifier}}),
//           {
//             type: "Identifier",
//             name: identifiers[0]})})),
//     ArrayLite.map(
//       ["get", "set"],
//       (accessor) => ({
//         type: "Property",
//         kind: "init",
//         key: {
//           type: "Literal",
//           value: "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments')." + accessor},
//         value: {
//           type: "MemberExpression",
//           computed: false,
//           object: {
//             type: "CallExpression",
//             callee: {
//               type: "MemberExpression",
//               computed: false,
//               object: {
//                 type: "Identifier",
//                 name: "Reflect"},
//               property: {
//                 type: "Identifier",
//                 name: "getOwnPropertyDescriptor"}},
//             arguments: [
//               {
//                 type: "MemberExpression",
//                 computed: false,
//                 object: {
//                   type: "Identifier",
//                   name: "Function"},
//                 property: {
//                   type: "Identifier",
//                   name: "prototype"}},
//               {
//                 type: "Literal",
//                 value: "arguments"}]},
//           property: {
//             type: "Identifier",
//             name: accessor}}})))});
//
// // Objects / Functions //
//
// prototype["builtin-object"] = global_eval(prototype["builtin-script"]);
//
// prototype["unary-function"] = global_eval(prototype["unary-script"]);
//
// prototype["binary-function"] = global_eval(prototype["binary-script"]);
//
// prototype["object-function"] = global_eval(prototype["object-script"]);

// Freeze //

// global_Object_freeze(prototype);

// Methods //

const show = (identifier) => (
  Stratum._is_meta(identifier) ?
  "#" + Stratum._get_body(identifier) :
  (
    Stratum._is_base(identifier) ?
    Stratum._get_body(identifier) :
    "@" + identifier));

const prototype = {};

prototype["weave"] = function weave (estree1, pointcut, serial) {
  let nullable_scope = null;
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
    if (!Reflect.getOwnPropertyDescriptor(this.scopes, serial)) {
      throw new global_Error("serial does not refer to a node representing a direct eval call");
    }
    nullable_scope = this.scopes[serial];
  } else if (serial !== null && serial !== void 0) {
    throw new global_Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
  }
  if (global_Array_isArray(pointcut)) {
    const names = pointcut;
    pointcut = {__proto__:null};
    ArrayLite.forEach(
      names,
      (name) => pointcut[name] = true);
  } else if (typeof pointcut === "function") {
    const closure = pointcut;
    pointcut = {__proto__: null};
    ArrayLite.forEach(
      names,
      (name) => {
        pointcut[name] = (...args) => closure(name, args);});
  } else if (pointcut === false) {
    pointcut = {__proto__:null};
  } else if (pointcut === true) {
    const pointcut = {__proto__:null};
    ArrayLite.forEach(
      names,
      (name) => {
        pointcut[name] = true;});
  } else if (typeof pointcut !== "object" || pointcut === null) {
    throw new global_Error("The provided pointcut must be either an array, a closure, a boolean, or an object.");
  }
  const serials = new global_Map();
  const block1 = Normalize(nullable_scope, estree1, {
    __proto__: null,
    evals: this.evals,
    scopes: this.scopes,
    serials: serials
  });
  const block2 = Instrument(block1, {
    __proto__: null,
    tag: nullable_scope == null ? "program" : "eval",
    serials: serials,
    pointcut: pointcut,
    namespace: this.namespace
  });
  // const estree2 = Generate(block2, {
  //   __proto__: null,
  //   eval: nullable_scope === null,
  // });
  return estree2;
};

const parameters = ["NEW_TARGET", "ERROR", "THIS", "PARAMETER", "ARGUMENTS"];

module.exports = function Aran (namespace) {
  if (typeof namespace === "string") {
    if (global_Reflect_apply(global_RegExp_test, /(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*/u, [namespace])) {
      throw new global_Error(`The provided namespace ${global_JSON_stringify(string)} does not appear to be a valid ECMAScript identifier name -- cf https://www.ecma-international.org/ecma-262/11.0/index.html#prod-Identifier.`);
    }
    if (ArrayLite.includes(ReservedWords._reserved_words, namespace)) {
      if (ArrayLite.includes(ReservedWords._aran_reserved_words, namespace)) {
        throw new global_Error(`The provided namespace ${global_JSON_stringify(namespace)} is one of the aran-specific reserved words -- ie ${ArrayLite.join(ReservedWords._aran_reserved_words, ", ")}.`);
      }
      throw new global_Error(`The provided namespace ${global_JSON_stringify(namespace)} is an ECMAScript reserved word -- cf https://www.ecma-international.org/ecma-262/11.0/index.html#prod-ReservedWord.`);
    }
    if (ArrayLite.includes(parameters, namespace)) {
      throw new global_Error(`The provided namespace ${global_JSON_stringify(namespace)} is one of the aran-specific parameters -- ie ${ArrayLite.join(parameters, ", ")}.`);
    }
  } else if (namespace === null || namespace === void 0) {
    namespace = "__ADVICE__";
  } else {
    throw new global_Error(`The provided namespace is not a string, null or, undefined.`);
  }
  return {
    __proto__: prototype,
    namespace: namespace,
    scopes: {},
    nodes: [],
  };
};
