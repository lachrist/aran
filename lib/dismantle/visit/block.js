
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

const common = (nodes, scope) => (
  Scope.Completion(scope) ?
  ArrayLite.concat(
    ArrayLite.flatMap(
      ArrayLite.filter(node.body, (node) => node.type === "FunctionDeclaration"),
      (node) => Build.Expression(
        Scope.write(
          scope,
          node.id.name,
          Visit.node(node, scope, null),
          Build.primitive(void 0)))),
    ArrayLite.flatMap(
      ArrayLite.filter(node.body, (node) => node.type !== "FunctionDeclaration"),
      (node) => Visit.Node(
        node,
        (
          Query.LastValued(node, nodes) ?
          scope :
          Scope.ExtendCompletion(scope, null)),
        []))) :
  ArrayLite.concat(
    ArrayLite.flatMap(
      ArrayLite.filter(node.body, (node) => node.type === "FunctionDeclaration"),
      (node) => Build.Expression(
        Scope.write(
          scope,
          node.id.name,
          Visit.node(node, scope, null),
          Build.primitive(void 0)))),
    ArrayLite.flatMap(
      ArrayLite.filter(node.body, (node) => node.type !== "FunctionDeclaration"),
      (node) => Visit.Node(node, scope, []))));

exports.Program = (node, scope1, boolean) => Scope.BLOCK(
  (
    Query.IsStrictBody(node) ?
    Scope.ExtendStrict(scope1) :
    scope1),
  ArrayLite.concat(
    (
      scope1 || Query.IsStrictBody(node) ?
      Query.ClosureNames(node.body) :
      []),
    Query.BlockNames(node.body, "let")),
  ArrayLite.concat(
    scope1 ? [] : ["this"],
    Query,BlockNames(node.body, "const")),
  (scope2) => Scope.Token(
    scope2,
    Build.primitive(void 0),
    (token) => ArrayLite.concat(
      (
        scope1 ?
        [] :
        Build.Expression(
          Scope.declare(
            scope2,
            "this",
            Build.builtin("global"),
            Build.primitive(void 0)))),
      (
        scope1 || Query.IsStrictBody(node) ?
        ArrayLite.flatMap(
          Query.ClosureNames(node.body),
          (name) => Build.Expression(
            Scope.initialize(
              scope2,
              name,
              Build.primitive(void 0),
              Build.primitive(void 0)))) :
        ArrayLite.flatMap(
          Query.ClosureNames(node.body),
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
      Build.Expression(
        Scope.write(
          scope,
          token,
          Build.primitive(void 0),
          Build.primitive(void 0))),
      common(
        node.body,
        Scope.ExtendCompletion(scope2, token)))));

exports.BlockStatement = (node, scope, boolean) => (
  boolean ?
  Scope.BLOCK(
    scope,
    ArrayLite.concat(
      Query.ClosureNames(node.body),
      Query.BlockNames(node.body, "let")),
    Query.BlockNames(node.body, "const"),
    (scope) => ArrayLite.concat(
      ArrayLite.flatMap(
        Query.ClosureNames(node.body),
        (name) => Build.Expression(
          Scope.initialize(
            scope,
            name,
            Build.primitive(void 0),
            Build.primitive(void 0)))),
      common(
        node.body,
        Scope.ExtendCompletion(scope, null)))) :
  Scope.BLOCK(
    scope,
    Query.BlockNames(node.body, "let"),
    Query.BlockNames(node.body, "const"),
    (scope) => common(
      scope,
      Scope.ExtendLabelBoundary(scope))));
