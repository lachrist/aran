"use strict";

// type Valuation = Either Boolean Label
// 
// type Labels = Either Null (Head, Tail)
// type Head = Label
// type Tail = Labels

const loop /* Valuation */ = (statement, labels) => {
  if (statement.type === "BlockStatement") {
    for (let index = 0; index < statement.body.length; index++) {
      const valuation = loop(statement.body[index], labels);
      if (valuation !== false) {
        return valuation;
      }
    }
    return false;
  }
  if (statement.type === "LabeledStatement") {
    return loop(statement.body, {head:statement.label.name, tail:labels});
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
  if (statement.type === "DebuggerStatement" || statement.type === "EmptyStatement" || statement.type === "VariableDeclaration" || statement.type === "FunctionDeclaration" || statement.type === "ClassDeclaration") {
    return false;
  }
  return true;
};

exports._get_valuation = (statement) => loop(statement, null);
