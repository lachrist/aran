
"use strict";

// type Completion === Maybe Bool

const loop /* Completion */ = (statement, labels) => {
  if (statement.type === "BlockStatement") {
    for (let index = 0; index < statement.body.length; index++) {
      const completion = loop(statement.body[index], labels);
      if (completion !== false) {
        return completion;
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

exports._get_static_completion_value = (statement) => loop(statement, null);
