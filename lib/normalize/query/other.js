"use strict";

// https://tc39.es/ecma262/#directive-prologue
exports._has_use_strict_directive = (statements) => {
  for (let index = 0; index < statements.length; index++) {
    if (statements[index].type !== "ExpressionStatement") {
      return false;
    }
    if (statements[index].expression.type !== "Literal") {
      return false;
    }
    if (typeof statements[index].expression.value !== "string") {
      return false;
    }
    if (statements[index].expression.value === "use strict") {
      return true;
    }
  }
  return false;
};

// exports._is_spread_property = (property) => property.type === "SpreadElement";
// exports._is_not_spread_property = (property) => property.type !== "SpreadElement";
// exports._is_proto_property = (property) => (
//   property.type !== "SpreadElement" &&
//   property.kind === "init" &&
//   !property.method &&
//   !property.computed &&
//   property.key[property.key.type === "Identifier" ? "name" : "value"] === "__proto__");
// exports._is_not_proto_property = (property) => (
//   property.type === "SpreadElement" ||
//   property.kind !== "init" ||
//   property.method ||
//   property.computed ||
//   property.key[property.key.type === "Identifier" ? "name" : "value"] !== "__proto__");
//
// exports._is_function_declaration_statement = (statement) => statement.type === "FunctionDeclaration";
// exports._is_not_function_declaration_statement = (statement) => statement.type !== "FunctionDeclaration";
//
// exports._is_spread_argument = (argument) => argument.type === "SpreadElement";
// exports._is_not_spread_argument = (argument) => argument.type !== "SpreadElement";
//
// exports._is_identifier_pattern = (pattern) => pattern.type === "Identifier";
//
// exports._is_constructor_method = (method) => method.kind === "constructor";
// exports._is_static_method = (method) => (
//   method.kind !== "constructor" &&
//   method.static);
// exports._is_instance_method = (method) => (
//   method.kind !== "constructor" &&
//   !method.static);
//
// exports._get_consequent_case = (node) => node.consequent;

// type Valuation = Either Boolean Label
//
// type Labels = Either Null (Head, Tail)
// type Head = Label
// type Tail = Labels

const get_valuation_loop /* Valuation */ = (statement, labels) => {
  if (statement.type === "BlockStatement") {
    for (let index = 0; index < statement.body.length; index++) {
      const valuation = get_valuation_loop(statement.body[index], labels);
      if (valuation !== false) {
        return valuation;
      }
    }
    return false;
  }
  if (statement.type === "LabeledStatement") {
    return get_valuation_loop(statement.body, {head:statement.label.name, tail:labels});
  }
  if (statement.type === "BreakStatement" || statement.type === "ContinueStatement") {
    if (statement.label === null) {
      return null;
    }
    while (labels !== null) {
      if (labels.head === statement.label.name) {
        return false;
      }
      labels = labels.tail;
    }
    return statement.label.name;
  }
  return (
    statement.type !== "DebuggerStatement" &&
    statement.type !== "EmptyStatement" &&
    statement.type !== "VariableDeclaration" &&
    statement.type !== "FunctionDeclaration" &&
    statement.type !== "ClassDeclaration" &&
    statement.type !== "ExportDeclaration" &&
    statement.type !== "ImportDeclaration");
};

exports._get_valuation = (statement) => get_valuation_loop(statement, null);
