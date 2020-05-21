
"use strict";

// type Completion === Maybe Bool

const loop = (statement) => {
  if (statement.type === "BlockStatement") {
    for (let index = 0; index < statement.body.length; index++) {
      const completion = loop(statement.body[index]);
      if (completion !== false) {
        return completion;
      }
    }
    return false;
  }
  if (statement.type === "LabeledStatement") {
    return loop(statement.body);
  }
  if (statement.type === "BreakStatement" || statement.type === "ContinueStatement") {
    return null;
  }
  if (statement.type === "DebuggerStatement" || statement.type === "EmptyStatement" || statement.type === "VariableDeclaration" || statement.type === "FunctionDeclaration" || statement.type === "ClassDeclaration") {
    return false;
  }
  return true;
};

exports._completion = loop
