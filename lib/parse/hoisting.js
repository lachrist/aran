"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_WeakMap_prototype_set = global.WeakMap.prototype.set;

const ArrayLite = require("array-lite");

//////////
// Util //
//////////

const isNotNull = (any) => any !== null;

const getName = ({name}) => name;

///////////
// State //
///////////

let hoistings = null;

const bind = (node, variables, predicate) => (
  global_Reflect_apply(
    global_WeakMap_prototype_set,
    hoistings,
    [
      node,
      ArrayLite.filter(variables, predicate)]),
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
exports.hoistProgram = (node, options) => (
  hoistings = options.hoistings,
  bind(
    node,
    Variable.checkDuplicate(
      ArrayLite.map(
        ArrayLite.flatMap(node.body, hoist),
        (variable) => ArrayLite.reduce(node.body, finalizeExports, variable)),
      hoist),
    (
      options.type === "module" ?
      Variable.isModule :
      (
        options.type === "script" ?
        Variable.isScript :
        // console.asset(options.type === "eval")
        (
          options.strict ?
          Variable.isStrictEval :
          Variable.isSloppyEval)))));

//////////////
// Function //
//////////////

const checkUniqueParameter = (identifier, index, identifiers) => (
  Throw.assert(
    ArrayLite.indexOf(identifiers, identifier) === index,
    Throw.SyntaxError,
    `Duplicate parameter not allowed in strict mode nor in non-simple parameter list: ${identifier}`),
  identifier);

// hoistClosure :: (estree.ArrowFunctionExpression | estree.FunctionExpression | estree.FunctionDeclaration) -> {hoistings: Map estree.Node [Variable], strict: boolean} -> [Variable]
exports.hoistClosure = (node, options, _variables) => (
  hoistings = options.hoistings,
  _variables = Variable.checkDuplicate(
    ArrayLite.concat(
      ArrayLite.map(
        (
          !options.strict &&
          ArrayLite.every(node.params, isIdentifier)) ?
        ArrayLite.map(node.params, getName) :
        ArrayLite.map(
          ArrayLite.flatMap(node.params, collect),
          checkUniqueParameter)),
      (
        (
          node.type === "ArrowFunctionExpression" &&
          node.expression) ?
        [] :
        ArrayLite.flatMap(node.body.body, hoist)))),
  bind(
    node,
    (
      (
        node.type === "ArrowFunctionExpression" &&
        node.expression) ?
      _variables :
      bind(node.body, _variables, Variable.isClosureBody)),
    Variable.isClosureHead));

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
    checkDuplicate(
      ArrayLite.flatMap(node.body, hoist)),
    Variable.isBlock),
  ForStatement: (node) => ArrayLite.concat(
    (
      (
        node.init !== null &&
        node.init.type === "VariableDeclaration") ?
      bind(
        node,
        Variable.checkDuplicate(
          hoist(node.init)),
        Variable.isBlock) :
      []),
    hoist(node.body)),
  ForInStatement: (node) => ArrayLite.concat(
    (
      node.left.type === "VariableDeclaration" ?
      bind(
        node,
        Variable.checkDuplicate(
          hoist(node.left)),
        Variable.isBlock) :
      []),
    hoist(node.body)),
  ForOfStatement: (node) => ArrayLite.concat(
    (
      node.left.type === "VariableDeclaration" ?
      bind(
        node,
        Variable.checkDuplicate(
          hoist(node.left)),
        Variable.isBlock) :
      []),
    hoist(node.body)),
  SwitchStatement: (node) => bind(
    node,
    Variable.checkDuplicate(
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
  VariableDeclaration: (node) => ArrayLite.flatMap(
    node.declarations,
    (node) => ArrayLite.map(
      collect(node.id),
      Variable[Variable.getConstructorName(node.kind)])),
  ImportDeclaration: (node) => ArrayLite.map(
    ArrayLite.flatMap(node.specifiers, normalize),
    ({identifier, specifier}) => Variable.Import(identifier, specifier, node.source.value)),
  ExportAllDeclaration: (node) => [],
  ExportDefaultDeclaration: (node) => ArrayLite.map(
    hoist(node.declaration),
    exportDefault),
  ExportNamedDeclaration: (node) => (
    node.declaration !== null ?
    ArrayLite.map(
      hoist(node.declaration),
      exportSelf) :
    []),
  // Special //
  CatchClause: (node) => bind(
    node,
    bind(
      node.body,
      checkDuplicate(
        ArrayLite.concat(
          (
            node.param ==== null ?
            [] :
            ArrayLite.map(
              collect(node.param),
              (
                node.param.type === "Identifier" ?
                Variable.SimpleErrorParam :
                Variable.ComplexErrorParam))),
          ArrayLite.flatMap(node.body.body, visitCatchBlock))),
      Variable.isBlock),
    Variable.isCatchHead),
  SwitchCase: (node) => ArrayLite.flatMap(node.consequent, hoist)};

///////////////
// Specifier //
///////////////

// normalize :: estree.Specifier -> {identifier:Identifier, specifier:Specifier}
const normalize = (node) => normalize_visitor_object[node.type](node);

const normalize_visitor_object = {
  __proto__: null,
  ExportSpecifier: (node) => ({
    name: node.local.name,
    specifier: node.exported.name}),
  ImportSpecifier: (node) => ({
    name: node.local.name,
    specifier: node.imported.name}),
  ImportDefaultSpecifier: (node) => ({
    name: node.local.name,
    specifier: "default"}),
  ImportNamespaceSpecifier: (node) => ({
    name: node.local.name,
    specifier: null})};

/////////////
// Pattern //
/////////////

// collect :: (estree.Pattern | estree.MemberExpression | estree.CallExpression | estree.VariableDeclarator) -> [Identifier]
var collect = (node) => collect_visitor_object[node.type](node);

const collect_visitor_object = {
  __proto__: null,
  VariableDeclarator: collect(node.id),
  Identifier: (node) => [node.name],
  MemberExpression: (node) => [],
  CallExpression: (node) => [],
  RestElement: (node) => collect(node.argument),
  ArrayPattern: (node) => ArrayLite.flatMap(
    ArrayLite.filter(node.elements, isNotNull),
    collect),
  Property: (node) => collect(node.value),
  ObjectPattern: (node) => ArrayLite.flatMap(node.properties, collect)};
