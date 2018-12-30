
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

const common = (scope, nodes) => ArrayLite.concat(
  ArrayLite.flatMap(
    ArrayLite.filter(nodes, (node) => node.type === "FunctionDeclaration"),
    (node) => Scope.Write(
      scope,
      node.id.name,
      Visit.node(node, scope, ""))),
  ArrayLite.flatMap(
    ArrayLite.filter(nodes, (node) => node.type !== "FunctionDeclaration"),
    (node) => Visit.Node(node, scope)));

exports.Program = (node, scope1, boolean) => Scope.BLOCK(
  (
    (
      !Scope.GetStrict(scope1) &&
      node.body.length > 0 &&
      node.body[0].type === "ExpressionStatement" &&
      node.body[0].expression.type === "Literal" &&
      node.body[0].expression.value === "use strict") ?
    Scope.ExtendStrict(scope1) :
    scope1),
  ArrayLite.concat(
    (
      (
        scope1 ||
        (
          node.body.length > 0 &&
          node.body[0].type === "ExpressionStatement" &&
          node.body[0].expression.type === "Literal" &&
          node.body[0].expression.value === "use strict")) ?
      Query.BodyNames(node, "var") :
      []),
    Query.BodyNames(node, "let")),
  ArrayLite.concat(
    scope1 ? [] : ["this"],
    Query.BodyNames(node, "const")),
  (scope2) => ArrayLite.concat(
    (
      scope1 ?
      [] :
      Scope.Initialize(
        scope2,
        "this",
        Build.builtin("global"))),
    (
      scope1 || Scope.GetStrict(scope2) ?
      ArrayLite.flatMap(
        Query.BodyNames(node, "var"),
        (name) => Scope.Initialize(
          scope2,
          name,
          Build.primitive(void 0))) :
      ArrayLite.flatMap(
        Query.BodyNames(node, "var"),
        (name) => Build.Expression(
          Build.apply(
            Build.builtin("AranDefineDataProperty"),
            Build.primitive(void 0),
            [
              Build.builtin("global"),
              Build.primitive(name),
              Build.primitive(true),
              Build.primitive(true),
              Build.primitive(false)])))),
      (
        node.body.length === 0 ?
        Build.Expression(
          Build.primitive(void 0)) :
        Scope.Token(
          scope2,
          Build.primitive(void 0),
          (token) => ArrayLite.concat(
            common(
              Scope.ExtendCompletion(scope2, token),
              node.body),
            Build.Expression(
              Scope.read(scope2, token)))))));

exports.BlockStatement = (node, scope, boolean) => (
  boolean ?
  Scope.BLOCK(
    (
      (
        !Scope.GetStrict(scope) &&
        node.body.length > 0 &&
        node.body[0].type === "ExpressionStatement" &&
        node.body[0].expression.type === "Literal" &&
        node.body[0].expression.value === "use strict") ?
      Scope.ExtendStrict(scope) :
      scope),
    ArrayLite.concat(
      Query.BodyNames(node, "var"),
      Query.BodyNames(node, "let")),
    Query.BodyNames(node, "const"),
    (scope) => ArrayLite.concat(
      ArrayLite.flatMap(
        Query.BodyNames(node, "var"),
        (name) => Scope.Initialize(
          scope,
          name,
          Build.primitive(void 0))),
      common(scope, node.body))) :
  Scope.BLOCK(
    scope,
    Query.BodyNames(node, "let"),
    Query.BodyNames(node, "const"),
    (scope) => common(scope, node.body)));

ArrayLite.forEach(["ForStatement", "ForOfStatement", "ForInStatement"], (type) => {
  const key = type === "ForStatement" ? "init" : "left";
  exports[type] = (node1, scope, boolean) => {
    if (node1[key].type !== "VariableDeclaration" || node1[key].kind === "var")
      return Scope.BLOCK(scope, [], [], (scope) => Visit.Node(node1, scope));
    const node2 = node1[key];
    node1[key] = null;
    const block = Scope.BLOCK(
      scope,
      (
        node2.kind === "let" ?
        ArrayLite.flatMap(node2.declarations, Query.DeclarationNames) :
        []),
      (
        node2.kind === "const" ?
        ArrayLite.flatMap(node2.declarations, Query.DeclarationNames) :
        []),
      (scope) => ArrayLite.concat(
        Visit.Node(node2, scope),
        Visit.Node(node1, scope)));
    node1[key] = node2;
    return block;
  };
});

ArrayLite.forEach([
  "EmptyStatement",
  "LabeledStatement",
  "ExpressionStatement",
  "FunctionDeclaration",
  "DebuggerStatement",
  "BreakStatement",
  "ContinueStatement",
  "ReturnStatement",
  "ThrowStatement",
  "TryStatement",
  "WithStatement",
  "IfStatement",
  "WhileStatement",
  "DoWileStatement",
  "SwitchStatement"
], (type) => {
  exports[type] = (node, scope, boolean) => {
    return Scope.BLOCK(scope, [], [], (scope) => Visit.Node(node, scope));
  };
});
