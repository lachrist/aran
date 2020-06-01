
const ArrayLite = require("array-lite");

const Query = require("../query.js");
const Completion = require("../completion.js");

exports.REGULAR = (statements, scope, completion) => Scope.EXTEND_STATIC(
  scope,
  Query._get_shallow_hoisting(statements),
  (scope) => Lang.Bundle(
    ArrayLite.map(
      ArrayLite.concat(
        ArrayLite.filter(statements, Query._is_function_declaration),
        ArrayLite.filter(statements, Query._is_not_function_declaration)),
      (statement, index, statements) => Statement.Visit(
        statement,
        scope,
        Completion._extend(completion, index, statements),
        []))));

const get_consequent = (switch_case) => switch_case.consequent;

const get_consequent_function_declaration = ArrayLite.filter(switch_case.consequent, Query._is_function_declaration);

// type DiscriminantBox = Box
// type MatchedBox = Box
exports.SWITCH = (switch_cases, scope, completion, discrimiant_box, matched_box) => Scope.EXTEND_STATIC(
  scope,
  Query._get_shallow_hoisting(
    ArrayLite.flatMap(switch_cases, get_consequent)),
  (scope) => Lang.Bundle(
    ArrayLite.concat(
      ArrayLite.map(
        ArrayLite.flatMap(switch_cases, get_consequent_function_declaration),
        (statement, index, statements) => Statement.Visit(
          statement,
          scope,
          Completion.child(completion, index, statements),
          [])),
      ArrayLite.map(
        switch_cases,
        (switch_case) => (
          node.test === null ?
          // Lone Block for consistency reasons
          Lang.Lone(
            [],
            Scope.EXTEND_STATIC(
              scope,
              {__proto__:null},
              (scope) => Lang.Bundle(
                ArrayLite.concat(
                  Lang.Lift(
                    Scope.set(
                      scope,
                      matched_box,
                      Lang.primitive(true))),
                  ArrayLite.flatMap(
                    ArrayLite.filter(switch_case.consequent, Query._is_not_function_declaration),
                    (statement, index, statement) => Statement.Visit(
                      statement,
                      scope,
                      Completion._extend(completion, index, statements),
                      [])))))) :
          Lang.If(
            [],
            Lang.conditional(
              Scope.get(scope, matched_box),
              Lang.primitive(true),
              Lang.conditional(
                Lang.binary(
                  "===",
                  Scope.get(scope, discrimiant_box),
                  Visit.node(node.test, scope, false, null)),
                Lang.sequence(
                  Scope.set(
                    scope,
                    matched_box,
                    Lang.primitive(true)),
                  Lang.primitive(true)),
                Lang.primitive(false))),
            Scope.EXTEND_STATIC(
              scope,
              {__proto__:null},
              (scope) => ArrayLite.flatMap(
                ArrayLite.filter(switch_case.consequent, Query._is_not_function_declaration),
                (statement, index, statement) => Statement.Visit(
                  statement,
                  scope,
                  Completion._extend(completion, index, statements),
                  [])))))))));

exports.CLOSURE = (statements, scope, completion, _hoisting) => (
  _hoisting = Query._get_deep_hoisting(statements),
  Scope.EXTEND_STATIC(
    scope,
    global_Object_assign(
      {__proto__:null},
      Query._get_shallow_hoisting(statements),
      _hoisting),
    (scope) => Lang.Bundle(
      ArrayLite.concat(
        ArrayLite.map(
          global_Reflect_ownKeys(_hoistng),
          (identifier) => Lang.Lift(
            Scope.initialize(scope, identifier, void 0))),
        ArrayLite.map(
          ArrayLite.concat(
            ArrayLite.filter(statements, Query._is_function_declaration),
            ArrayLite.filter(statements, Query._is_not_function_declaration)),
          (statement, index, statements) => Statement.Visit(
            statement,
            scope,
            Completion._extend(completion, index, statements),
            []))))));

exports.PROGRAM = (statements, scope, _hoisting1, _hoisting2, _completion) => (
  _hoisting1 = Query._get_deep_hoisting(statements),
  _hoisting2 = Query._get_shallow_hoisting(statements),
  Scope.EXTEND_STATIC(
    scope,
    (
      Scope._is_strict(scope) ?
      (
        Scope._is_eval(scope) ?
        _hoisting2 :
        global_Object_assign(
          {
            __proto__: null,
            this: false},
          _hoisting2)) :
      (
        Scope._is_eval(scope) ?
        global_Object_assign(_hoisting1, _hoisting2) :
        global_Object_assign(
          {
            __proto__: null,
            this: false},
          _hoisting1,
          _hoisting2))),
    (scope) => Lang.Bundle(
      ArrayLite.concat(
        ArrayLite.map(
          global_Reflect_ownKeys(_hoistng),
          (
            Scope._is_strict(scope) ?
            (identifier) => Lang.Lift(
              Scope.initialize(scope, identifier, void 0)) :
            (identifier) => Lang.Lift(
              Lang.apply(
                Lang.builtin("Reflect.defineProperty"),
                Lang.primitive(void 0),
                [
                  Lang.builtin("global"),
                  Lang.primitive(identifier),
                  Lang.object(
                    Lang.primitive(null),
                    [
                      [
                        Lang.primitive("writable"),
                        Lang.primitive(true)],
                      [
                        Lang.primitive("enumerable"),
                        Lang.primitive(true)],
                      [
                        Lang.primitive("value"),
                        Lang.primitive(void 0)]])])))),
        (
          statements.length === 0 ?
          Lang.Return(
            Build.primitive(void 0)) :
          (
            statements[statements.length - 1].type === "ExpressionStatement" ?
            (
              _completion = Completion._make(null),
              ArrayLite.map(
                (statement, index, statements) => (
                  index === statements.length - 1 ?
                  Lang.Return(
                    Expression.visit(statements.expression, scope, false, null)) :
                  Statement.Visit(statement, scope, _completion, [])))) :
            Scope.Box(
              scope,
              "completion",
              true,
              (box) => (
                _completion = Completion._make(box),
                Lang.Bundle(
                  ArrayLite.concat(
                    ArrayLite.map(
                      ArrayLite.concat(
                        ArrayLite.filter(statements, Query._is_function_declaration),
                        ArrayLite.filter(statements, Query._is_not_function_declaration)),
                      (statement, index, statements) => Statement.Visit(
                        statement,
                        scope,
                        Completion._extend(completion, index, statements),
                        [])),
                    Lang.Return(Scope.get(scope, box))))))))))));




















// completion

const child_completion = (completion, statements, offset) => {
  if (Completion._is_program(completion) {
    for (let index = offset + 1; index < statements.length; index+) {
      const completion = (Query._completion(statements[index]));
      if (completion === null) {
        return Completion._set_is_last(completion, true);
      }
      if (completion === true) {
        return Completion._set_is_last(completion, false);
      }
    }
  }
  return completion;
};

const make_kontinuation = (statement, completion) => (
  statement.type === "BlockStatement" ?
  (scope) => ArrayLite.concat(
    ArrayLite.flatMap(
      statement.body,
      (statement, index) => (
        statement.type === "FunctionDeclaration" ?
        Visit.Statement(
          statement,
          scope,
          child_completion(completion, statement.body, index),
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
          child_completion(completion, statement.body, index),
          [])))) :
  Visit.Statement(statement, scope, completion, []));

const rearange = (statements) => ArrayLite.concat(
  ArrayLite.filter(statements, (statement) => statement.type === "FunctionDeclaration"),
  ArrayLite.filter(statements, (statement) => statement.type !== "FunctionDeclaration")),

const kontinue = (statements, completion) => (scope) => ArrayLite.concat(
  ArrayLite.flatMap(
    statements,
    (statement, index) => (
      statement.type === "FunctionDeclaration" ?
      Visit.Statement(
        statement,
        scope,
        completion,
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
        child_completion(completion, statements, index),
        []))));

exports.BLOCK = (before, statements, after, scope, completion, hoisting) => Scope.EXTEND_STATIC(
  scope,
  Query._shallow_hoisting(hoisting),
  (scope) => ArrayLite.concat(
    before(scope),
    ArrayLite.flatMap(
      rearange(statements),
      (statement, index, statements) => Visit.Statement(
        statement,
        scope,
        child_completion(completion, statements, index),
        []),
    after(scope))));

exports.CLOSURE = (statements, scope, completion, _hoisting) => (
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
          child_completion(completion, statements, index),
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
      child_completion(completion, statements, index),
      [])));

exports.SWITCH = 

exports.REGULAR = (statements, scope, completion, hoisting) => Scope.EXTEND_STATIC(
  scope,
  Query._shallow_hoisting(hoisting, statements),
  (scope) => ArrayLite.flatMap(
    rearange(statements),
    (statement, index, statements) => Visit.Statement(
      statement,
      scope,
      child_completion(completion, statements, index),
      [])));




exports.DYNAMIC = (statement, scope, completion, dynamic) => Scope.DYNAMIC(
  scope,
  dynamic,
  Query._shallow_hoisting({__proto__:null}, statement),
  make_kontinuation(statement, completion));

exports.REGULAR = (statement, scope, completion) => Scope.REGULAR(
  scope,
  Query._shallow_hoisting({__proto__:null}, statement),
  make_kontinuation(statement, completion));

exports.CLOSURE = (scope, statement, completion) => Scope.CLOSURE(
  scope,
  Query._deep_hoisting(
    Query._shallow_hoisting({__proto__:null}, statement),
    statement),
  make_kontinuation(statement, completion));

exports.GLOBAL = (statements) => Scope.GLOBAL(
  Query._is_use_strict(statements),
  
  Query._shallow_hoisting({__proto__:null}, statements)

exports.SWITCH = (switch_cases, scope, completion, matched_container1, discriminant_container2) => {};


    
    () => (
      Completion._is_program(completion) ?
      (scope) => ArrayLite.concat(
        ArrayLite.flatMap(
          statement.body,
          (statement, index) => (
            statement.type === "FunctionDeclaration" ?
            Visit.Statement(statement, scope, completion, []) :
            [])),
        ArrayLite.flatMap(
          statement.body,
          (statement, index) => (
            statement.type === "FunctionDeclaration" ?
            [] :
            Visit.statement(statement, scope, completion, []))))
      (scope) => ArrayLite.concat(
        ArrayLite.flatMap(
          statement.body,
          (statement) => (
            statement.type === "FunctionDeclaration" ?
            Visit.Statement(statement, scope, completion, []) :
            [])),
        ArrayLite.flatMap(
          statement.body,
          (statement) => (
            statement.type === "FunctionDeclaration" ?
            [] :
            Visit.statement(statement, scope, completion, [])))))) :
  (scope) => Visit.statement(statement, scope, completion, []));

exports.DYNAMIC_BLOCK = (dynamic, statement, completion) => Scope.DYNAMIC_BLOCK(
  scope,
  dynamic,
  Query._shallow_hoisting({__proto__:null}, statements),
  make_kontinuation(statement, completion));
  


const regular = (scope, statements, completion) => Scope.REGULAR_BLOCK(
  scope,
  Query._shallow_hoisting({__proto__:null}, statements),
  (
    Completion._is_program(completion) ?
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

exports.Body = (estree_statements, scope, completion) => ArrayLite.concat(
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
        Completion.GetCompletionCache(completion) === null ||
        estree_statement.type === "BreakStatement" ||
        estree_statement.type === "ContinueStatement" ||
        estree_statement.type === "EmptyStatement" ||
        estree_statement.type === "DebuggerStatement" ||
        estree_statement.type === "FunctionDeclaration" ||
        estree_statement.type === "VariableDeclaration" ||
        estree_statement.type === "ReturnStatement" ||
        estree_statement.type === "ThrowStatement") ?
      Visit.Node(estree_statement, scope, completion, []) :
      (
        completion = (
          (
            Completion.IsLast(completion) ?
            outcome_chain(estree_statements, index + 1) === VALUE :
            outcome_chain(estree_statements, index + 1) === LABEL) ?
          Completion.FlipLast(completion) :
          completion),
        (
          (
            !Completion.IsLast(completion) ||
            estree_statement.type === "LabeledStatement" ||
            estree_statement.type === "BlockStatement") ?
          Visit.Node(estree_statement, scope, completion, []) :
          (
            estree_statement.type === "ExpressionStatement" ?
            Build.Expression(
              Scope.write(
                scope,
                Completion.GetCompletionCache(completion),
                Visit.estree_expression(estree_statement.expression, scope, false, null))) :
            ArrayLite.concat(
              Build.Expression(
                Scope.write(
                  scope,
                  Completion.GetCompletionCache(completion),
                  Build.primitive(void 0))),
              Visit.Node(estree_statement, scope, completion, []))))))));
