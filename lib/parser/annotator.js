"use strict";

const global_Reflect_getOwnPropertyDescriptor = global.Reflect.getOwnPropertyDescriptor;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_set = global.Map.prototype.set;
const global_Object_assign = global.Object.assign

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Source = require("./source.js");
const Cache = require("./cache.js");
const Hoisting = require("./hoisting.js");

//////////
// Util //
//////////

const isNotNull = (any) => any !== null;

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

let annotations = null;

const setAnnotation = (setter, node, value, _annotation) => (
  _annotation = global_Reflect_apply(global_Map_prototype_get, annotations, [node]),
  (
    _annotation === void 0 ?
    (
      _annotation = Annotation.make(),
      setter(annotation, value),
      global_Reflect_apply(global_Map_prototype_set, annotations, [node, annotation])) :
    setter(_annotation, value)));

const getAnnotation = (getter, node, _annotation) => (
  _annotation = global_Reflect_apply(global_Map_prototype_get, _annotation, [node]),
  Throw.assert(_annotation !== void 0, null, `Missing annotation`),
  getter(_annotation));

const setHoisting = (node, variables) => setAnnotationannotate(Annotation.setHoisting, node, variables);

///////////////
// Interface //
///////////////

exports.annotate = (node, source) => (
  annotations = new global_Map(),
  setAnnotation(
    Annotation.setUseStrictDirective,
    node,
    hasUseStrictDirective(node.body)),
  Hoisting.hoistProgram(node, setHoisting),
  source = Source.extendScope(
    (
      getAnnotation(Annotation.hasUseStrictDirective, node) ?
      Source.extendStrict(
        Source.toEval(source)) :
      Source.toEval(source)),
    ArrayLite.filter(
      getAnnotation(Annotation.getHoisting, node),
      Source.getVariablePredicate(
        source,
        getAnnotation(Annotation.hasUseStrictDirective, node)))),
  setAnnotation(
    Annotation.setDirectEvalCall,
    node,
    ArrayLite.reduce(
      ArrayLite.map(
        node.body,
        (node) => visit(node, source)),
      or,
      false)),
  annotations);

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
  visit(node.key, source),
  visitClosure(
    node.value,
    source,
    (
      node.kind === "constructor" ?
      (
        derived ?
        "derived-constructor" :
        "constructor") :
      "method")));

const visitClass = (node, source) => (
  source = Source.extendStrict(source),
  or(
    (
      node.superClass === null ?
      false :
      visit(node.superClass, source)),
    visitClassBody(node.body, source, node.superClass !== null)));

const visitClosure = (node, source, mode, _source) => (
  Throw.assert(
    (
      (node.type === "ArrowFunctionExpression") ===
      (mode === null)),
    null,
    `Arrow extension mismatch`),
  setAnnotation(
    Annotation.setUseStrictDirective,
    node,
    (
      (
        node.type === "ArrowFunctionExpression" &&
        node.expression) ?
      false :
      hasUseStrictDirective(node.body.body))),
  source = (
    getAnnotation(Annotation.hasUseStrictDirective, node) ?
    Source.extendStrict(source) :
    source),
  Throw.assert(
    isEmpty(
      Hoisting.hoistClosure(node, setHoisting)),
    null,
    `Variable escape from closure`),
  Throw.assert(
    (
      (
        !Source.isStrict(source) &&
        ArrayLite.every(node.params, isIdentifier) &&
        node.type !== "ArrowFunctionExpression") ||
      ArrayLite.every(
        ArrayLite.map(node.params, Variable.getName),
        isFirstOccurence)),
    Throw.SyntaxError,
    `Duplicate parameters are not allowed in arrows, in strict mode or in non-simple parameter lists`),
  source = (
    node.type === "ArrowFunctionExpression" ?
    Source.extendArrow(source) :
    Source.extendFunction(source, mode)),
  _source = Source.extendScope(
    source,
    getAnnotation(Annotation.getHoisting, node)),
  setAnnotation(
    annotation.setDirectEvalCall,
    node,
    ArrayLite.reduce(
      ArrayLite.map(
        node.params,
        (node) => visit(node, _source)),
      or,
      false)),
  Cache.setDirectEvalCall(
    cache,
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
    source = Source.extendScope(
      source,
      Cache.getHoisting(cache, node)),
    ArrayLite.reduce(
      ArrayLite.map(
        node.body,
        (node) => visit(node, source)),
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
    source = Source.extendScope(
      source,
      Cache.getHoisting(cache, node)),
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
    source = Source.extendScope(
      source,
      Cache.getHoisting(cache, node)),
    or(
      visit(node.left, source),
      or(
        visit(node.right, source),
        visit(node.body, source)))),
  ForOfStatement: (node, source) => (
    source = Source.extendScope(
      source,
      Cache.getHoisting(cache, node)),
    or(
      visit(node.left, source),
      or(
        visit(node.right, source),
        visit(node.body, source)))),
  SwitchStatement: (node, source) => (
    source = Source.extendScope(
      source,
      Cache.getHoisting(cache, node)),
    or(
      visit(node.discriminant, source),
      ArrayLite.reduce(
        ArrayLite.map(
          node.cases,
          (node) => visit(node, source)),
        or,
        false))),
  TryStatement: (node, source) => or(
    visit(node.block, source),
    or(
      (
        node.handler === null ?
        false :
        visit(node.handler, source)),
      (
        node.finalizer === null ?
        false :
        visit(node.finalizer, source)))),
  // Declaration //
  VariableDeclaration: (node, source) => ArrayLite.reduce(
    ArrayLite.map(
      node.declarations,
      (node) => visit(node, source)),
    or,
    false),
  FunctionDeclaration: (node, source) => visitClosure(node, source, "function"),
  ClassDeclaration: visitClass,
  ImportDeclaration: (node, source) => false,
  ExportAllDeclaration: (node, source) => false,
  ExportDefaultDeclaration: (node, source) => visit(node.declaration, source),
  ExportNamedDeclaration: (node, source) => (
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
  SwitchCase: (node, source) => or(
    (
      node.test === null ?
      false :
      visit(node.test, source)),
    ArrayLite.reduce(
      ArrayLite.map(
        node.consequent,
        (node) => visit(node, source)),
      or,
      false)),
  CatchClause: (node, source) => (
    source = Source.extendScope(
      source,
      Cache.getHoisting(cache, node)),
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
  Super: (node, source) => false,
  AssignmentExpression: (node, source) => or(
    visit(node.left, source),
    visit(node.right, source)),
  UpdateExpression: (node, source) => visit(node.argument, source),
  ThisExpression: (node, source) => false,
  MetaProperty: (node, source) => false,
  // Literal //
  TaggedTemplateExpression: (node, source) => or(
    visit(node.quasi, source),
    visit(node.tag, source)),
  TemplateLiteral: (node, source) => or(
    ArrayLite.reduce(
      ArrayLite.map(
        node.quasis,
        (node) => visit(node, source)),
      or,
      false),
    ArrayLite.reduce(
      ArrayLite.map(
        node.expressions,
        (node) => visit(node, source)),
      or,
      false)),
  Literal: (node, source) => false,
  ArrowFunctionExpression: (node, source) => visitClosure(node, source, null),
  FunctionExpression: (node, source) => visitClosure(node, source, "function"),
  ClassExpression: visitClass,
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
  ChainExpression: (node, source) => visit(node.expression, source),
  ImportExpression: (node, source) => visit(node.source, source),
  YieldExpression: (node, source) => visit(node.argument, source),
  AwaitExpression: (node, source) => visit(node.argument, source),
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
          Cache.setSource(cache, node, source),
          true) :
        false))),
  // Other //
  TemplateElement: (node, source) => false,
  SpreadElement: (node, source) => visit(node.argument, source),
  Property: (node, source) => or(
    visit(node.key, source),
    (
      node.method ?
      visitClosure(node.value, source, "method") :
      visit(node.value, source))),
  /////////////
  // Pattern //
  /////////////
  RestElement: (node, source) => visit(node.argument, source),
  AssignmentPattern: (node, source) => or(
    visit(node.left, source),
    visit(node.right, source)),
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
