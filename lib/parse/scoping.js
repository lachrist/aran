"use strict";

const global_Map = global.Map;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Map_prototype_set = global.Map.prototype.set;

const ArrayLite = require("array-lite");
const Hoisting = require("./hoisting.js");

//////////
// Util //
//////////

const get = (map, key) => global_Reflect_apply(
  global_Map_prototype_get,
  map,
  [key]);

const set = (map, key, value) => global_Reflect_apply(
  global_Map_prototype_set,
  map,
  [key, value]);

const isEmpty = (array) => array.length === 0;

const or = (boolean1, boolean2) => boolean1 || boolean2;

const hasUseStrictDirective = (nodes) => {
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].type !== "ExpressionStatement") {
      return false;
    }
    if (global_Reflect_getOwnPropertyDescriptor(nodes[index], "directive") === void 0) {
      return false;
    }
    if (nodes[index].directive === "use strict") {
      return true;
    }
  }
  return false;
};

///////////
// State //
///////////

let sources = null;

let hoistings = null;

let evals = null;

///////////////
// Interface //
///////////////

exports.scopeProgram = (node, source, globals, _strict) => (
  hoistings = new global_Map(),
  sources = new global_Map(),
  evals = new global_Map(),
  _strict = hasUseStrictDirective(node.body),
  globals = Source.updateGlobals(
    source,
    globals,
    Hoisting.hoistProgram(
      node,
      hoistings,
      Source.getVariablePredicate(source, _strict))),
  source = Source.toEval(source),
  source = (
    _strict ?
    Source.extendStrict(source) :
    source),
  set(
    evals,
    node,
    ArrayLite.reduce(
      ArrayLite.map(
        node.body,
        (node) => visit(node, source)))),
  {
    node,
    globals,
    hoistings,
    sources,
    evals});

////////////////////////////////
// Context-Sensitive Visitors //
////////////////////////////////

const visitClassBody = (node, source, derived) => ArrayLite.reduce(
  ArrayLite.map(
    node.body,
    (node) => visitMethodDefinition(node, source, derived)),
  or,
  false);

const visitMethodDefinition = (node, source, derived) => or(
  (
    node.computed ?
    visit(node.key, source) :
    false),
  visitClosure(
    node.value,
    source,
    (
      child.kind === "constructor" ?
      (
        derived ?
        "derived-constructor" :
        "constructor") :
      "method")));

const visitClosure = (node, source, mode) => (
  Throw.assert(
    (
      (node.type === "ArrowFunctionExpression") ===
      (mode === null)),
    null,
    `Arrow extension mismatch`),
  source = (
    (
      node.type === "ArrowFunctionExpression" &&
      node.expression) ?
    source :
    (
      hasDirectEvalCall(node.body.body) ?
      Source.extendStrict(source) :
      source)),
  Throw.assert(
    isEmpty(
      Hoisting.hoistClosure(
        node,
        hoistings,
        Source.isStrict(source))),
    null,
    `Variable escaped from closure`),
  source = (
    node.type === "ArrowFunctionExpression" ?
    Source.extendArrow(source) :
    Source.extendFunction(mode)),
  source = Source.extendScope(
    source,
    get(hoistings, node)),
  set(
    evals,
    node,
    ArrayLite.reduce(
      ArrayLite.map(
        node.params,
        (node) => visit(node, source)),
      or,
      false)),
  source = (
    (
      node.type === "ArrowFunctionExpression" &&
      node.expression) ?
    source :
    Source.extendScope(
      source,
      get(hoistings, node.body))),
  set(
    evals,
    node.body,
    visit(node.body, source)),
  false);

//////////////////////////////////
// Context-Insensitive Visitors //
//////////////////////////////////

const visit = (node, source) => visitors[node.type](node, source);

const visitors = {
  __proto__: null,
  ///////////////
  // Statement //
  ///////////////
  // Atomic //
  EmptyStatement: (node, source) => false,
  DebuggerStatement: (node, source) => false,
  ExpressionStatement: (node, source) => visit(node.expression, source),
  ThrowStatement: (node, source) => visit(node.argument, source),
  ReturnStatement: (node, source) => (
    node.argument === null ?
    false :
    visit(node.argument, source)),
  ContinueStatement: (node, source) => false,
  BreakStatement: (node, source) => false,
  // Compound //
  LabeledStatement: (node, source) => visit(node.body, source),
  BlockStatement: (node, source) => (
    source = extendHoisting(source, node),
    ArrayLite.reduce(
      ArrayLite.map(
        node.body,
        (node) => visitStatement(node, source)),
      or,
      false)),
  IfStatement: (node, source) => or(
    visit(node.test, source),
    or(
      visit(node.consequent, source),
      (
        node.alternate === null ?
        false :
        visit(node.alternate, source)))),
  WhileStatement: (node, source) => or(
    visit(node.test, source),
    visit(node.body, source)),
  DoWhileStatement: (node, source) => or(
    visit(node.test, source),
    visit(node.body, source)),
  WithStatement: (node, source) => or(
    visit(node.object, source),
    visit(node.body, source)),
  ForStatement: (node, source) => (
    source = extendHoisting(source, node),
    or(
      (
        node.init === null ?
        false :
        visit(node.init, source)),
      or(
        (
          node.test === null ?
          false :
          visit(node.test, source)),
        or(
          (
            node.update === null ?
            false :
            visit(node.update, source)),
          visit(node.body, source))))),
  ForInStatement: (node, source) => (
    source = extendHoisting(source, node),
    or(
      visit(node.left, source),
      or(
        visit(node.right, source),
        visit(node.body, source)))),
  ForOfStatement: (node, source) => (
    source = extendHoisting(source, node),
    or(
      visit(node.left, source),
      or(
        visit(node.right, source).
        visit(node.body, source)))),
  SwitchStatement: (node, source) => (
    source = extendHoisting(source, node),
    ArrayLite.reduce(
      ArrayLite.map(
        node.cases,
        (node) => visit(node, source)),
      or,
      false)),
  // Declaration //
  VariableDeclaration: (node, source) => (
    source = extendHoisting(source, node),
    ArrayLite.reduce(
      ArrayLite.map(
        node.declarations,
        (node) => visit(node, source)),
      or,
      false)),
  FunctionDeclaration: (node, source) => visitFunction(node, source, "function"),
  ClassDeclaration: (node, source) => (
    source = Source.extendStrict(source),
    or(
      (
        node.superClass === null ?
        false :
        visit(node)),
      visitClassBody(node, source, node.superClass !== null))),
  ImportDeclaration: (node, source) => false,
  ExportAllDeclaration: (node, source) => false,
  ExportDefaultDeclaration: (node, source) => visit(node.declaration, source),
  ExportNamedDeclaration: (node) => (
    node.declaration !== null ?
    visit(node.declaration, source) :
    false),
  // Other //
  VariableDeclarator: (node, source) => or(
    visit(node.id, source),
    (
      node.init === null ?
      false :
      visit(node.init, source))),
  SwitchCase: (node, source) => ArrayLite.flatMap(
    node,
    (node) => visit(node, source)),
  CatchClause: (node, source) => (
    source = extendHoisting(source, node),
    or(
      (
        node.param === null ?
        false :
        visit(node.param, source)),
      visit(node.body, source))),
  ////////////////
  // Expression //
  ////////////////
  // Environment //
  Identifier: (node, source) => false,
  AssignmentExpression: (node, source) => or(
    visit(node.left, source),
    visit(node.right, source)),
  UpdateExpression: (node, source) => visit(node.argument, source),
  ThisExpression: (node, source) => false,
  MetaProperty: (node, source) => false,
  // Literal //
  Literal: (node, source) => false,
  ArrowFunctionExpression: (node, source) => visitClosure(node, source, null),
  FunctionExpression: (node, source) => visitClosure(node, source, "function"),
  ArrayExpression: (node, source) => ArrayLite.reduce(
    ArrayLite.map(
      ArrayLite.filter(node.elements, isNotNull),
      (node) => visit(node, source)),
    or,
    false),
  ObjectExpression: (node, source) => ArrayLite.reduce(
    ArrayLite.map(
      node.properties,
      (node) => visit(node, source)),
    or,
    false),
  // Control //
  LogicalExpression: (node, source) => or(
    visit(node.left, source),
    visit(node.right, source)),
  ConditionalExpression: (node, source) => or(
    visit(node.test, source),
    or(
      visit(node.consequent, source),
      visit(node.alternate, source))),
  SequenceExpression: (node, source) => ArrayLite.reduce(
    ArrayLite.map(
      node.expressions,
      (node) => visit(node, source)),
    or,
    false),
  // Combination //
  MemberExpression: (node, source) => or(
    visit(node.object, source),
    visit(node.property, source)),
  UnaryExpression: (node, source) => visit(node.argument, source),
  BinaryExpression: (node, source) => or(
    visit(node.left, source),
    visit(node.right, source)),
  NewExpression: (node, source) => or(
    visit(node.callee, source),
    ArrayLite.reduce(
      ArrayLite.map(
        node.arguments,
        (node) => visit(node, source)),
      or,
      false)),
  CallExpression: (node, source) => or(
    visit(node.callee, source),
    ArrayLite.reduce(
      ArrayLite.map(
        node.arguments,
        (node) => visit(node, source)),
      or,
      (
        (
          node.callee.type === "Identifier" &&
          node.callee.name === "eval") ?
        (
          set(sources, node, source)
          true) :
        false))),
  // Other //
  SpreadElement: (node, source) => visit(node.argument, source),
  Property: (node, source) => or(
    visit(node.key, source),
    (
      node.value.type === "FunctionExpression" ?
      visitClosure(node.value, source, "method") :
      visit(node.value, source))),
  /////////////
  // Pattern //
  /////////////
  RestElement: (node, source) => visit(node.argument, source),
  ArrayPattern: (node, source) => ArrayLite.reduce(
    ArrayLite.map(
      ArrayLite.filter(node.elements, isNotNull),
      (node) => visit(node, source)),
    or,
    false),
  ObjectPattern: (node, source) => ArrayLite.reduce(
    ArrayLite.map(
      node.properties,
      (node) => visit(node, source)),
    or,
    false)};
