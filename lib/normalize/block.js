
const ArrayLite = require("array-lite");

const Pattern = require("./pattern.js");

const global_Symbol = global.Symbol;

const EMPTY = global_Symbol("empty");
const LABEL = global_Symbol("label");
const VALUE = global_Symbol("value");

const collect_function_declarations = (nodes) => ArrayLite.filter(
  ArrayLite.flatMap(
    nodes,
    (node) => (
      node.type === "SwitchCase" ?
      node.consequent :
      node)),
  (node) => node.type === "FunctionDeclaration");

// No completion:
// ==============
// eval("'foo'; a:{break a}")
// 'foo'

const outcome = (node) => (
  (
    node.type === "BreakStatement" ||
    node.type === "ContinueStatement") ?
  LABEL :
  (
    (
      node.type === "EmptyStatement" ||
      node.type === "DebuggerStatement" ||
      node.type === "FunctionDeclaration" ||
      node.type === "VariableDeclaration") ?
    EMPTY :
    (
      node.type === "LabeledStatement" ?
      outcome(node.body) :
      (
        node.type === "BlockStatement" ?
        outcome_chain(node.body, 0) :
        VALUED))));

const outcome_chain = (nodes, index) => {
  if (index >= nodes.length) {
    return EMPTY;
  }
  const symbol = outcome(nodes, index);
  if (symbol === EMPTY) {
    return outcome(nodes, index + 1);
  }
  return symbol;
};

exports.Body = (nodes, scope, lexic) => ArrayLite.concat(
  ArrayLite.flatMap(
    collect_function_declarations(nodes),
    (node) => Build.Expression(
      Scope.write(
        scope,
        node.id.name,
        Closure.function(node, scope, null)))),
  ArrayLite.flatMap(
    nodes,
    (node, index) => (
      (
        Lexic.GetCompletionCache(lexic) === null ||
        node.type === "BreakStatement" ||
        node.type === "ContinueStatement" ||
        node.type === "EmptyStatement" ||
        node.type === "DebuggerStatement" ||
        node.type === "FunctionDeclaration" ||
        node.type === "VariableDeclaration" ||
        node.type === "ReturnStatement" ||
        node.type === "ThrowStatement") ?
      Visit.Node(node, scope, lexic, []) :
      (
        lexic = (
          (
            Lexic.IsLast(lexic) ?
            outcome_chain(nodes, index + 1) === VALUE :
            outcome_chain(nodes, index + 1) === LABEL) ?
          Lexic.FlipLast(lexic) :
          lexic),
        (
          (
            !Lexic.IsLast(lexic) ||
            node.type === "LabeledStatement" ||
            node.type === "BlockStatement") ?
          Visit.Node(node, scope, lexic, []) :
          (
            node.type === "ExpressionStatement" ?
            Build.Expression(
              Scope.write(
                scope,
                Lexic.GetCompletionCache(lexic),
                Visit.node(node.expression, scope, false, null))) :
            ArrayLite.concat(
              Build.Expression(
                Scope.write(
                  scope,
                  Lexic.GetCompletionCache(lexic),
                  Build.primitive(void 0))),
              Visit.Node(node, scope, lexic, []))))))));
