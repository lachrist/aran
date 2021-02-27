"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_set = global.Map.prototype.set;

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Variable = require("../variable.js");

//////////
// Util //
//////////

const isNotNull = (any) => any !== null;

// const isIdentifierNode = ({type}) => type === "Identifier";

const checkCompatibility = (variables) => {
  for (let index1 = 0; index1 < variables.length; index1++) {
    for (let index2 = index1 + 1; index2 < variables.length; index2++) {
      Variable.checkCompatibility(variables[index1], variables[index2]);
    }
  }
  return variables;
};

const isEmpty = (array) => array.length === 0;

// const isFirstOccurence = (element, index, array) => ArrayLite.indexOf(array, element) === index;

///////////
// State //
///////////

let setHoisting = null;

const bind = (node, variables, predicate) => (
  setHoisting(
    node,
    ArrayLite.filter(variables, predicate)),
  ArrayLite.filterOut(variables, predicate));

/////////////
// Program //
/////////////

const finalizeExports = (variable, node) => (
  (
    node.type === "ExportNamedDeclaration" &&
    node.declaration === null &&
    node.source === null) ?
  ArrayLite.reduce(node.specifiers, Variable.exportNamed, variable) :
  variable);

// hoistProgram :: estree.Program -> {hoistings: Map estree.Node [Variable], strict: boolean, type: "module" | "script" | "eval"} -> [Variable]
exports.hoistProgram = (node, closure) => (
  setHoisting = closure,
  Throw.assert(
    isEmpty(
      bind(
        node,
        checkCompatibility(
          ArrayLite.map(
            ArrayLite.flatMap(node.body, hoist),
            (variable) => ArrayLite.reduce(node.body, finalizeExports, variable)),
          hoist),
        Variable.isProgram)),
    null,
    `Variable escape from program`),
  void 0);

//////////////
// Function //
//////////////

// hoistClosure :: (estree.ArrowFunctionExpression | estree.FunctionExpression | estree.FunctionDeclaration) -> {hoistings: Map estree.Node [Variable], strict: boolean} -> [Variable]
exports.hoistClosure = (node, closure, _identifiers, _variables) => (
  setHoisting = closure,
  // _identifiers = ArrayLite.flatMap(node.params, collect),
  // Throw.assert(
  //   (
  //     (
  //       !strict &&
  //       node.type !== "ArrowFunctionExpression" &&
  //       ArrayLite.every(node.params, isIdentifierNode)) ||
  //     ArrayLite.every(_identifiers, isFirstOccurence)),
  //   `Duplicate parameters are not allowed in strict mode nor in arrows nor in non-simple parameter lists`),
  _variables = checkCompatibility(
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(node.params, collect),
        Variable.Param),
      (
        (
          node.type === "ArrowFunctionExpression" &&
          node.expression) ?
        [] :
        ArrayLite.flatMap(node.body.body, hoist)))),
  Throw.assert(
    isEmpty(
      bind(
        node,
        (
          (
            node.type === "ArrowFunctionExpression" &&
            node.expression) ?
          _variables :
          bind(node.body, _variables, Variable.isClosureBody)),
        Variable.isClosureHead)),
    null,
    `Variable escape from closure`),
  void 0);

///////////////
// Statement //
///////////////

// node :: estree.Statement | estree.SwitchCase | estree.CatchClause -> [Variables]
const hoist = (node) => hoist_visitor_object[node.type](node);

const hoist_visitor_object = {
  __proto__:null,
  // Atomic //
  DebuggerStatement: (node) => [],
  EmptyStatement: (node) => [],
  ExpressionStatement: (node) => [],
  BreakStatement: (node) => [],
  ContinueStatement: (node) => [],
  ThrowStatement: (node) => [],
  ReturnStatement: (node) => [],
  // Compound //
  WithStatement: (node) => hoist(node.body),
  LabeledStatement: (node) => hoist(node.body),
  WhileStatement: (node) => hoist(node.body),
  DoWhileStatement: (node) => hoist(node.body),
  IfStatement: (node) => ArrayLite.concat(
    hoist(node.consequent),
    (
      node.alternate === null ?
      [] :
      hoist(node.alternate))),
  TryStatement: (node) => ArrayLite.concat(
    hoist(node.block),
    (
      node.handler === null ?
      [] :
      hoist(node.handler)),
    (
      node.finalizer === null ?
      [] :
      hoist(node.finalizer))),
  BlockStatement: (node) => bind(
    node,
    checkCompatibility(
      ArrayLite.flatMap(node.body, hoist)),
    Variable.isBlock),
  ForStatement: (node) => ArrayLite.concat(
    bind(
      node,
      checkCompatibility(
        (
          (
            node.init !== null &&
            node.init.type === "VariableDeclaration") ?
          hoist(node.init) :
          [])),
      Variable.isBlock),
    hoist(node.body)),
  ForInStatement: (node) => ArrayLite.concat(
    bind(
      node,
      checkCompatibility(
        (
          node.left.type === "VariableDeclaration" ?
          hoist(node.left) :
          [])),
      Variable.isBlock),
    hoist(node.body)),
  ForOfStatement: (node) => ArrayLite.concat(
    bind(
      node,
      checkCompatibility(
        (
          node.left.type === "VariableDeclaration" ?
          hoist(node.left) :
          [])),
      Variable.isBlock),
    hoist(node.body)),
  SwitchStatement: (node) => bind(
    node,
    checkCompatibility(
      ArrayLite.flatMap(node.cases, hoist)),
    Variable.isBlock),
  // Declaration //
  ClassDeclaration: (node) => (
    node.id !== null ?
    [
      Variable.Class(node.id.name)] :
    []),
  FunctionDeclaration: (node) => (
    node.id !== null ?
    [
      Variable.Function(node.id.name)] :
    []),
  VariableDeclaration: (node) => ArrayLite.map(
    ArrayLite.flatMap(node.declarations, collect),
    Variable[Variable.getConstructorName(node.kind)]),
  ImportDeclaration: (node) => ArrayLite.map(
    ArrayLite.map(node.specifiers, normalize),
    ({identifier, specifier}) => Variable.Import(identifier, specifier, node.source.value)),
  ExportAllDeclaration: (node) => [],
  ExportDefaultDeclaration: (node) => (
    (
      node.declaration.type === "FunctionDeclaration" ||
      node.declaration.type === "ClassDeclaration") ?
    ArrayLite.map(
      hoist(node.declaration),
      Variable.exportDefault) :
    []),
  ExportNamedDeclaration: (node) => (
    node.declaration !== null ?
    ArrayLite.map(
      hoist(node.declaration),
      Variable.exportSelf) :
    []),
  // Special //
  CatchClause: (node) => bind(
    node,
    bind(
      node.body,
      checkCompatibility(
        ArrayLite.concat(
          (
            node.param === null ?
            [] :
            ArrayLite.map(
              collect(node.param),
              (
                node.param.type === "Identifier" ?
                Variable.SimpleErrorParam :
                Variable.ComplexErrorParam))),
          ArrayLite.flatMap(node.body.body, hoist))),
      Variable.isBlock),
    Variable.isCatchHead),
  SwitchCase: (node) => ArrayLite.flatMap(node.consequent, hoist)};

///////////////
// Specifier //
///////////////

// normalize :: estree.ImportSpecifier -> {identifier:Identifier, specifier:Specifier}
const normalize = (node) => normalize_visitor_object[node.type](node);

const normalize_visitor_object = {
  __proto__: null,
  ImportSpecifier: (node) => ({
    identifier: node.local.name,
    specifier: node.imported.name}),
  ImportDefaultSpecifier: (node) => ({
    identifier: node.local.name,
    specifier: "default"}),
  ImportNamespaceSpecifier: (node) => ({
    identifier: node.local.name,
    specifier: null})};

/////////////
// Pattern //
/////////////

// collect :: (estree.Pattern | estree.MemberExpression | estree.CallExpression | estree.VariableDeclarator) -> [Identifier]
var collect = (node) => collect_visitor_object[node.type](node);

const collect_visitor_object = {
  __proto__: null,
  VariableDeclarator: (node) => collect(node.id),
  Identifier: (node) => [node.name],
  AssignmentPattern: (node) => collect(node.left),
  RestElement: (node) => collect(node.argument),
  ArrayPattern: (node) => ArrayLite.flatMap(
    ArrayLite.filter(node.elements, isNotNull),
    collect),
  Property: (node) => collect(node.value),
  ObjectPattern: (node) => ArrayLite.flatMap(node.properties, collect)};
