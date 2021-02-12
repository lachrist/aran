"use strict";

const ArrayLite = require("array-lite");
const Hoisting = require("./hoisting.js");

const or = (boolean1, boolean2) => boolean1 || boolean2;


const bindSource = (source) => (node) => visit(node, source);

const scope = (source, node) => ({
  type: source.type,
  strict: source.strict,
  identifiers: ArrayLite.concat(
    source.identifiers,
    ArrayLite.map(
      ArrayLite.filter(
        global_Reflect_apply(global_Map_prototype_get, hoistings, [node]),
        Variable.isRigid),
      Variable.getName)),
})

visitors = {
  __proto__: null,
  ///////////////
  // Statement //
  ///////////////
  // Atomic //
  EmptyStatement: (node, source) => false,
  ExpressionStatement: (node, source) => visit(node.expression, source),
  ThrowStatement: (node, source) => visit(node.argument, source),
  ReturnStatement: (node, source) => (
    node.argument === null ?
    false :
    visit(node.argument, source)),
  ContinueStatement: (node, source) => false,
  BreakStatement: (node, source) => false,
  // Compound //
  // Declaration //
  // Other //
  SwitchCase: (node, source) => ArrayLite.flatMap(
    node,
    bindSource(source)),
  CatchClause: (node, source) => (
    
}









exports.scopeProgram = (node, hoistings, scoping) => {};

exports.scopeClosure = (node, hoistings, scoping) => {};











parse = (code, source, globals) => ();

const extend = (scoping, node, _scoping) => (
  _scoping = global_Reflect_apply(
    global_Map_prototype_get,
    hoistings,
    [node]),
  ArrayLite.concat(
    ArrayLite.filterOut(
      scoping,
      (variable1) => ArrayLite.some(
        _scoping,
        (variable2) => variable1.name === variable2.name)),
    _scoping));

/////////////
// Program //
/////////////

exports.scopeProgram = (node, identifiers, source, _scoping) => (
  hoistings = new global_Map(),
  scopings = new global_Map(),
  evals = new global_Map(),
  _scoping = hoistProgram(node, hoistings, source),
  (
    ArrayLite.reduce(
      ArrayLite.map(
        node.body,
        (node) => visitStatement(node, scoping)),
      or,
      false) ?
    mark(node) :
    null),
  {
    hoistings,
    scopings,
    evals});

const extend = (node, scopes, _identifiers) => (
  _identifiers = ArrayLite.map(
    ArrayLite.filter(
      global_Reflect_apply(global_Map_prototype_get, hoistings, node),
      isRigidVariable),
    getName),
  ArrayLite.map(
    scopes,
    ({0:node, 1:identifiers}) => [
      node,
      ArrayLite.concat(identifiers, _identifiers)));

const bind = (node, scopes) => (
  global_Reflect_apply(global_Map_prototype_set, evals, [node, scopes.length === 0]),
  ArrayLite.forEach(
    scopes,
    (scope) => global_Reflect_apply(global_Map_prototype_set, scopings, scope)),
  []);

///////////////
// Statement //
///////////////

const visitVariableDeclarator = (node) => ArrayLite.concat(
  visitPattern(node.id),
  (
    node.init === null ?
    [] :
    visitExpression(node.init)));

const visitSwitchCase = (node) => ArrayLite.flatMap(node.consequent, visitStatement);

const visitCatchClause = (node) => scope(
  node,
  ArrayLite.concat(
    (
      node.param === null ?
      [] :
      visitPattern(node.param)),
    visitStatement(node.body)));

{
  var visitStatement = (node) => visitors[node.type](node);
  const visitors = {
    __proto__: null,
    // Atomic //
    EmptyStatement: (node, source) => [],
    ReturnStatement: (node, source) => (
      node.argument === null ?
      [] :
      visitExpression(node.argument, source)),
    ThrowStatement: (node, source) => visitExpression(node.argument, source),
    BreakStatement: (node, source) => [],
    ContinueStatement: (node, source) => [],
    // Extension //
    SwitchStatement: (node, source) => scope(
      node,
      ArrayLite.flatMap(node.cases, visitStatement)),
    ForStatement: (node) => scope(
      node,
      ArrayLite.concat(
        (
          node.init === null ?
          [] :
          (
            node.init.type === "VariableDeclaration" ?
            visitStatement(node.init) :
            visitExpression(node.init))),
        (
          node.test === null ?
          [] :
          visitExpression(node.test)),
        (
          node.update === null ?
          visitExpression(node.test)),
        visitStatement(node.body))),
    ForInStatement: (node, scoping) => scope(
      node,
      ArrayLite.concat(
        (
          node.left.type === "VariableDeclaration" ?
          visitStatement(node.left) :
          visitPattern(node.left)),
        visitExpression(node.right),
        visitStatement(node.body))),
    ForOfStatement: (node) => scope(
      node,
      ArrayLite.concat(
        (
          node.left.type === "VariableDeclaration" ?
          visitStatement(node.left) :
          visitPattern(node.left)),
        visitExpression(node.right),
        visitStatement(node.body))),
    // Declaration //
    VariableDeclaration: (node) => ArrayLite.flatMap(node.declarations, visitVariableDeclarator),
    FunctionDeclaration: (node) => {},
    ClassDeclaration: (node) => ArrayLite.concat(
      
    // Other //
    TryStatement: (node) => ArrayLite.concat(
      visitStatement(node.block),
      (
        node.handler === null ?
        [] :
        visitCatchClause(node.handler)),
      (
        node.finalizer === null ?
        [] :
        visitStatement(node.finalizer))),
    IfStatement: (node) => ArrayLite.concat(
      visitExpression(node.test),
      visitStatement(node.consequent),
      (
        node.alternate === null ?
        [] :
        visitStatement(node.alternate))),
    LabeledStatement: (node) => visitStatement(node.body),
    WithStatement: (node) => ArrayLite.concat(
      visitExpression(node.object),
      visitStatement(node.body)),
    WhileStatement: (node) => ArrayLite.concat(
      visitExpression(node.test),
      visitStatement(node.body)),
    DoWhileStatement: (node) => ArrayLite.concat(
      visitStatement(node.body),
      visitExpression(node.test))}; }

////////////////
// Expression //
////////////////



/////////////
// Pattern //
/////////////

{
  var visitPattern = 
