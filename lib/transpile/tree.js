"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Tree = require("../tree.js");
const State = require("./state.js");

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_String_prototype_toUpperCase = global.String.prototype.toUpperCase;

const build = {
  [0]: (constructor) => () => State.registerNode(Tree[constructor]()),
  [1]: (constructor) => (field1) => State.registerNode(Tree[constructor](field1)),
  [2]: (constructor) => (field1, field2) => State.registerNode(Tree[constructor](field1, field2)),
  [3]: (constructor) => (field1, field2, field3) => State.registerNode(Tree[constructor](field1, field2, field3)),
  [4]: (constructor) => (field1, field2, field3, field4) => State.registerNode(Tree[constructor](field1, field2, field3, field4)),
};

"lib/transpile/visit/index",
"lib/transpile/visit/other",
"lib/transpile/visit/pattern",
"lib/transpile/visit/closure",
"lib/transpile/visit/class",
"lib/transpile/visit/expression",
"lib/transpile/visit/link-statement",
"lib/transpile/visit/hoisted-statement",
"lib/transpile/visit/statement",
"lib/transpile/visit/block",

const get = (serial) => {
  const location = aran.locations[serial];
  if (location.parent === null) {
    
  }
  
  for (let key of keys) {
    object = object[key];
  }
  return object;
};

node = {
  type:
    // Other
    "KeyExpression" | Identifier Literal
    // "NamedExpression" |
    "Pattern" | Identifier CallExpression MemberExpression AssignmentPattern Property RestElement ObjectPattern
    // Closure
    // "Closure" |
    // Class
    // "Class" |
    "MethodDefinition" | MethodDefinition
    // Expression
    "Expression" | Expression
    "SpreadArgument" | SpreadElement Expression
    "MemberCallee" | MemberExpression
    "QuasiElement" | QuasiElement
    "ObjectProperty" | Property
    // "NormalProperty" |
    // "ProtoProperty" |
    // LinkStatement
    "ModuleDeclaration" | ImportDeclaration ExportDeclaration
    "ImportSpecifier" | ImportSpecifier
    "ExportSpecifier" | ExportSpecifier
    // HoistedStatement
    "HoistedStatement" | FunctionDeclaration
    // Statement
    "Statement" | Statement
    "VariableDeclarator" | VariableDeclarator
    "CatchClause" | CatchClause
    "SwitchCase" | SwitchCase
    // Block
    "Block" | BlockStatement Statement
    "ClosureBody" | BlockStatement Expression
    "SwitchBody" | SwitchStatement
    "SwitchCaseConsequent" | SwitchCase
    "Program" | Program
  node: estree.node,
  parent: serial,
  childeren: serial
}

ArrayLite.forEach(global_Reflect_ownKeys(Tree), (key) => {
  if (global_Reflect_apply(global_String_prototype_toUpperCase, key[0], []) === key[0]) {
    exports[key] = build[Tree[key].length](key);
  } else {
    exports[key] = Tree[key];
  }
});

exports.EvalExpression = (field, source, scope) => State.registerEvalNode(Tree.EvalExpression(field), source, scope);

ArrayLite.forEach([
  "IntrinsicExpression",          // intrinsic.js
  "Block",                        // scope/layer-1-core.js
  "ReadExpression",               // scope/layer-1-core && scope/layer-3-meta (TestBox only)
  "WriteExpression",              // scope/layer-1-core && scope/layer-3-meta (TestBox only)
  "EvalExpression",               // scope/layer-5-index
  "DeclareEnclaveStatement",      // scope/layer-5-index
  "ReadEnclaveExpression",        // scope/layer-5-index
  "TypeofEnclaveExpression",      // scope/layer-5-index
  "WriteEnclaveExpression",       // scope/layer-5-index
  "CallSuperEnclaveExpression",   // scope/layer-5-index
  "MemberSuperEnclaveExpression"  // scope/layer-5-index
], (constructor) => {
  exports["__" + constructor + "__"] = exports[constructor];
  exports[constructor] = () => Throw.abort(null, `Forbidden construction of ${constructor}`);
});
