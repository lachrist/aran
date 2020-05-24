
const ArrayLite = require("array-lite");

const Pattern = require("./pattern.js");

const global_Symbol = global.Symbol;

const EMPTY = global_Symbol("empty");
const LABEL = global_Symbol("label");
const VALUE = global_Symbol("value");

// completion

const child_lexic = (lexic, statements, offset) => {
  if (Lexic._is_program(lexic) {
    for (let index = offset + 1; index < statements.length; index+) {
      const completion = (Query._completion(statements[index]));
      if (completion === null) {
        return Lexic._set_is_last(lexic, true);
      }
      if (completion === true) {
        return Lexic._set_is_last(lexic, false);
      }
    }
  }
  return lexic;
};

const make_kontinuation = (statement, lexic) => (
  statement.type === "BlockStatement" ?
  (scope) => ArrayLite.concat(
    ArrayLite.flatMap(
      statement.body,
      (statement, index) => (
        statement.type === "FunctionDeclaration" ?
        Visit.Statement(
          statement,
          scope,
          child_lexic(lexic, statement.body, index),
          []) :
        [])),
    ArrayLite.flatMap(
      statement.body,
      (statement, index) => (
        statement.type === "FunctionDeclaration" ?
        [] :
        Visit.Statement(
          statement,
          scope,
          child_lexic(lexic, statement.body, index),
          [])))) :
  Visit.Statement(statement, scope, lexic, []));

const rearange = (statements) => ArrayLite.concat(
  ArrayLite.filter(statements, (statement) => statement.type === "FunctionDeclaration"),
  ArrayLite.filter(statements, (statement) => statement.type !== "FunctionDeclaration")),

const kontinue = (statements, lexic) => (scope) => ArrayLite.concat(
  ArrayLite.flatMap(
    statements,
    (statement, index) => (
      statement.type === "FunctionDeclaration" ?
      Visit.Statement(
        statement,
        scope,
        lexic,
        []) :
      [])),
  ArrayLite.flatMap(
    statements,
    (statement, index) => (
      statement.type === "FunctionDeclaration" ?
      [] :
      Visit.Statement(
        statement,
        scope,
        child_lexic(lexic, statements, index),
        []))));

exports.BLOCK = (before, statements, after, scope, lexic, hoisting) => Scope.EXTEND_STATIC(
  scope,
  Query._shallow_hoisting(hoisting),
  (scope) => ArrayLite.concat(
    before(scope),
    ArrayLite.flatMap(
      rearange(statements),
      (statement, index, statements) => Visit.Statement(
        statement,
        scope,
        child_lexic(lexic, statements, index),
        []),
    after(scope))));

exports.CLOSURE = (statements, scope, lexic, _hoisting) => (
  _hoisting = Query._deep_hoisting({__proto__:null, statements}),
  Scope.EXTEND_STATIC(
    scope,
    Query._shallow_hoisting(_hoisting),
    (scope) => ArrayLite.concat(
      ArrayLite.flatMap(
        global_Reflect_ownKeys(_hoisting),
        (identifier) => Build.Lift(
          Scope.initialize(scope, identifier, Build.primitive(void 0)))),
      ArrayLite.flatMap(
        rearange(statements),
        (statement, index, statements) => Visit.Statement(
          statement,
          scope,
          child_lexic(lexic, statements, index),
          [])))));

Scope.EXTEND_STATIC(
  scope,
  Query._deep_hoisting(
    Query._shallow_hoisting(
      {__proto__:null},
      statements)),
  (scope) => ArrayLite.flatMap(
    rearange(statements),
    (statement, index, statements) => Visit.Statement(
      statement,
      scope,
      child_lexic(lexic, statements, index),
      [])));

exports.SWITCH = 

exports.REGULAR = (statements, scope, lexic, hoisting) => Scope.EXTEND_STATIC(
  scope,
  Query._shallow_hoisting(hoisting, statements),
  (scope) => ArrayLite.flatMap(
    rearange(statements),
    (statement, index, statements) => Visit.Statement(
      statement,
      scope,
      child_lexic(lexic, statements, index),
      [])));




exports.DYNAMIC = (statement, scope, lexic, dynamic) => Scope.DYNAMIC(
  scope,
  dynamic,
  Query._shallow_hoisting({__proto__:null}, statement),
  make_kontinuation(statement, lexic));

exports.REGULAR = (statement, scope, lexic) => Scope.REGULAR(
  scope,
  Query._shallow_hoisting({__proto__:null}, statement),
  make_kontinuation(statement, lexic));

exports.CLOSURE = (scope, statement, lexic) => Scope.CLOSURE(
  scope,
  Query._deep_hoisting(
    Query._shallow_hoisting({__proto__:null}, statement),
    statement),
  make_kontinuation(statement, lexic));

exports.GLOBAL = (statements) => Scope.GLOBAL(
  Query._is_use_strict(statements),
  
  Query._shallow_hoisting({__proto__:null}, statements)

exports.SWITCH = (switch_cases, scope, lexic, matched_container1, discriminant_container2) => {};


    
    () => (
      Lexic._is_program(lexic) ?
      (scope) => ArrayLite.concat(
        ArrayLite.flatMap(
          statement.body,
          (statement, index) => (
            statement.type === "FunctionDeclaration" ?
            Visit.Statement(statement, scope, lexic, []) :
            [])),
        ArrayLite.flatMap(
          statement.body,
          (statement, index) => (
            statement.type === "FunctionDeclaration" ?
            [] :
            Visit.statement(statement, scope, lexic, []))))
      (scope) => ArrayLite.concat(
        ArrayLite.flatMap(
          statement.body,
          (statement) => (
            statement.type === "FunctionDeclaration" ?
            Visit.Statement(statement, scope, lexic, []) :
            [])),
        ArrayLite.flatMap(
          statement.body,
          (statement) => (
            statement.type === "FunctionDeclaration" ?
            [] :
            Visit.statement(statement, scope, lexic, [])))))) :
  (scope) => Visit.statement(statement, scope, lexic, []));

exports.DYNAMIC_BLOCK = (dynamic, statement, lexic) => Scope.DYNAMIC_BLOCK(
  scope,
  dynamic,
  Query._shallow_hoisting({__proto__:null}, statements),
  make_kontinuation(statement, lexic));
  


const regular = (scope, statements, lexic) => Scope.REGULAR_BLOCK(
  scope,
  Query._shallow_hoisting({__proto__:null}, statements),
  (
    Lexic._is_program(lexic) ?
    ...
    (scope) => ArrayLite.concat(
      ArrayLite.flatMap(
        statements,
        (statement) => (
          statement.type === "FunctionDeclaration" ?
          Visit.Statement(statement) :
          [])),
      ArrayLite.flatMap(
        statements,
        (statement) => (
          statement.type === "FunctionDeclaration" ?
          [] :
          Visit.statement(statement))))));

exports.REGULAR_BLOCK = (statement) => (
  
)

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
