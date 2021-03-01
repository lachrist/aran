"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_set = global.Map.prototype.set;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Reflect_defineProperty = global.Reflect.defineProperty;

const Throw = require("../throw.js");

// type Session = Maybe (State, Serial)
// type State = (Nodes, Serials, Evals, Counter)
// type Serial = Maybe Integer
// type Nodes = [Node]
// type Serials = WeakMap AranNode Serial
// type Evals = Map Serial [normalize.scope.core.Frame]

// "lib/transpile/visit/index",
// "lib/transpile/visit/other",
// "lib/transpile/visit/pattern",
// "lib/transpile/visit/closure",
// "lib/transpile/visit/class",
// "lib/transpile/visit/expression",
// "lib/transpile/visit/link-statement",
// "lib/transpile/visit/hoisted-statement",
// "lib/transpile/visit/statement",
// "lib/transpile/visit/block",

// node = {
//   type:
//     // Other
//     "KeyExpression" | Identifier Literal
//     // "NamedExpression" |
//     "Pattern" | Identifier CallExpression MemberExpression AssignmentPattern Property RestElement ObjectPattern
//     // Closure
//     // "Closure" |
//     // Class
//     // "Class" |
//     "MethodDefinition" | MethodDefinition
//     // Expression
//     "Expression" | Expression
//     "SpreadArgument" | SpreadElement Expression
//     "MemberCallee" | MemberExpression
//     "QuasiElement" | QuasiElement
//     "ObjectProperty" | Property
//     // "NormalProperty" |
//     // "ProtoProperty" |
//     // LinkStatement
//     "ModuleDeclaration" | ImportDeclaration ExportDeclaration
//     "ImportSpecifier" | ImportSpecifier
//     "ExportSpecifier" | ExportSpecifier
//     // HoistedStatement
//     "HoistedStatement" | FunctionDeclaration
//     // Statement
//     "Statement" | Statement
//     "VariableDeclarator" | VariableDeclarator
//     "CatchClause" | CatchClause
//     "SwitchCase" | SwitchCase
//     // Block
//     "Block" | BlockStatement Statement
//     "ClosureBody" | BlockStatement Expression
//     "SwitchBody" | SwitchStatement
//     "SwitchCaseConsequent" | SwitchCase
//     "Program" | Program
//   node: estree.node,
//   parent: serial,
//   childeren: serial
// }

let state = null;

const descriptor = {
  __proto__: null,
  enumerable: false
};

const visit = (type, transpiler, node, keys, context) => {
  for (let index = 0; index < keys.length; index++) {
    node = node[keys[index]];
  }
  const location = {
    type: type,
    parent: state.serial,
    keys: keys,
    node: node,
    annotation: global_Reflect_apply(global_Map_prototype_get, state.annotations, [node])
  };
  if (location.annotation === void 0) {
    location.annotation = {};
  }
  global_Reflect_defineProperty(location, "node", descriptor);
  state.serial = state.locations.length;
  state.locations[state.locations.length] = location;
  const result = transpiler(node, location.annotation, context);
  state.serial = location.parent;
  return result;
};

exports.makeRootVisitor = (type, transpiler) => (node, session, context) => {
  Throw.assert(state === null, null, "Another script is already being normalized (two scripts cannot be normalized concurrently).");
  state = session;
  try {
    return visit(type, transpiler, node, [], context);
  } finally {
    state = null;
  }
};

exports.makeVisitor = (type, transpiler) => (node, keys, context) => {
  Throw.assert(keys.length > 0, null, `Must visit child node`);
  return visit(type, transpiler, node, keys, context);
};

exports.registerNode = (node) => {
  global_Reflect_apply(global_Map_prototype_set, state.serials, [node, state.serial]);
  return node;
};
