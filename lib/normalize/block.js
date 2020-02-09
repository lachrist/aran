
const ArrayLite = require("array-lite");

const Pattern = require("./pattern.js");

const global_Symbol = global.Symbol;

const EMPTY = global_Symbol("empty");
const LABEL = global_Symbol("label");
const VALUE = global_Symbol("value");

const collect_estree_function_declarations = (estree_statements) => ArrayLite.filter(
  ArrayLite.flatMap(
    estree_statements,
    (estree_statement) => (
      estree_statement.type === "SwitchCase" ?
      estree_statement.consequent :
      [estree_statement])),
  (estree_statement) => estree_statement.type === "FunctionDeclaration");

// No completion:
// ==============
// eval("'foo'; a:{break a}")
// 'foo'

const outcome = (estree_statement) => (
  (
    estree_statement.type === "BreakStatement" ||
    estree_statement.type === "ContinueStatement") ?
  LABEL :
  (
    (
      estree_statement.type === "EmptyStatement" ||
      estree_statement.type === "DebuggerStatement" ||
      estree_statement.type === "FunctionDeclaration" ||
      estree_statement.type === "VariableDeclaration") ?
    EMPTY :
    (
      estree_statement.type === "LabeledStatement" ?
      outcome(estree_statement.body) :
      (
        estree_statement.type === "BlockStatement" ?
        outcome_chain(estree_statement.body, 0) :
        VALUED))));

const outcome_chain = (estree_statements, index) => {
  if (index >= estree_statements.length) {
    return EMPTY;
  }
  const symbol = outcome(estree_statements, index);
  if (symbol === EMPTY) {
    return outcome(estree_statements, index + 1);
  }
  return symbol;
};

exports.Body = (estree_statements, scope, lexic) => ArrayLite.concat(
  ArrayLite.flatMap(
    collect_function_declarations(estree_statements),
    (estree_statement) => Build.Expression(
      Scope.write(
        scope,
        estree_statement.id.name,
        VisitExpression.FunctionExpression(estree_statement, scope, null)))),
  ArrayLite.flatMap(
    estree_statements,
    (estree_statement, index) => (
      (
        Lexic.GetCompletionCache(lexic) === null ||
        estree_statement.type === "BreakStatement" ||
        estree_statement.type === "ContinueStatement" ||
        estree_statement.type === "EmptyStatement" ||
        estree_statement.type === "DebuggerStatement" ||
        estree_statement.type === "FunctionDeclaration" ||
        estree_statement.type === "VariableDeclaration" ||
        estree_statement.type === "ReturnStatement" ||
        estree_statement.type === "ThrowStatement") ?
      Visit.Node(estree_statement, scope, lexic, []) :
      (
        lexic = (
          (
            Lexic.IsLast(lexic) ?
            outcome_chain(estree_statements, index + 1) === VALUE :
            outcome_chain(estree_statements, index + 1) === LABEL) ?
          Lexic.FlipLast(lexic) :
          lexic),
        (
          (
            !Lexic.IsLast(lexic) ||
            estree_statement.type === "LabeledStatement" ||
            estree_statement.type === "BlockStatement") ?
          Visit.Node(estree_statement, scope, lexic, []) :
          (
            estree_statement.type === "ExpressionStatement" ?
            Build.Expression(
              Scope.write(
                scope,
                Lexic.GetCompletionCache(lexic),
                Visit.estree_expression(estree_statement.expression, scope, false, null))) :
            ArrayLite.concat(
              Build.Expression(
                Scope.write(
                  scope,
                  Lexic.GetCompletionCache(lexic),
                  Build.primitive(void 0))),
              Visit.Node(estree_statement, scope, lexic, []))))))));
