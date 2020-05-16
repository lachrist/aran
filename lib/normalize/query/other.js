
"use strict";

exports._is_direct_eval_call = (expression) => {
  if (expression.type !== "CallExpression") {
    return false;
  }
  if (expression.callee.type !== "Identifier") {
    return false;
  }
  if (expression.callee.name !== "eval") {
    return false;
  }
  for (let index = 0; index < expression.arguments.length; index++) {
    if (expression.arguments[index].type === "SpreadElement") {
      return false;
    }
  }
  return true;
};

// https://tc39.es/ecma262/#directive-prologue
exports._is_use_strict = (statements) => {
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
