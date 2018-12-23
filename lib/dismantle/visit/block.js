
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

const common = (scope, nodes) => (
  Scope.GetCompletion(scope) ?
  ArrayLite.concat(
    ArrayLite.flatMap(
      ArrayLite.filter(nodes, (node) => node.type === "FunctionDeclaration"),
      (node) => Scope.Write(
        scope,
        node.id.name,
        Visit.node(node, scope, ""))),
    ArrayLite.flatMap(
      ArrayLite.filter(nodes, (node) => node.type !== "FunctionDeclaration"),
      (node) => Visit.Node(
        node,
        (
          Query.LastValued(node, nodes) ?
          scope :
          Scope.ExtendCompletion(scope, null)),
        []))) :
  ArrayLite.concat(
    ArrayLite.flatMap(
      ArrayLite.filter(nodes, (node) => node.type === "FunctionDeclaration"),
      (node) => Scope.Write(
        scope,
        node.id.name,
        Visit.node(node, scope, null))),
    ArrayLite.flatMap(
      ArrayLite.filter(nodes, (node) => node.type !== "FunctionDeclaration"),
      (node) => Visit.Node(node, scope, []))));

exports.Program = (node, scope1, boolean) => Scope.BLOCK(
  (
    Query.IsBodyStrict(node) ?
    Scope.ExtendStrict(scope1) :
    scope1),
  ArrayLite.concat(
    (
      scope1 || Query.IsBodyStrict(node) ?
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
      scope1 || Query.IsBodyStrict(node) ?
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
        (
          node.body[node.body.length-1].type === "ExpressionStatement" ?
          ArrayLite.concat(
            common(
              Scope.ExtendCompletion(scope2, null),
              ArrayLite.slice(node.body, 0, node.body.length-1)),
            Build.Expression(
              Visit.node(node.body[node.body.length-1].expression, scope2))) :
          (
            Scope.Token(
              scope2,
              Build.primitive(void 0),
              (token) => ArrayLite.concat(
                common(
                  Scope.ExtendCompletion(scope2, token),
                  node.body),
                Build.Expression(
                  Scope.read(scope2, token)))))))));

exports.BlockStatement = (node, scope, boolean) => (
  boolean ?
  Scope.BLOCK(
    scope,
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
      common(
        Scope.ExtendCompletion(scope, null),
        node.body))) :
  Scope.BLOCK(
    scope,
    Query.BodyNames(node, "let"),
    Query.BodyNames(node, "const"),
    (scope) => common(scope, node.body)));
