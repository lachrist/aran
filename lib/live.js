
const global_Error = global.Error;

exports.unary = (operator, argument) => {
  switch (operator) {
    case "-":      return -      argument;
    case "+":      return +      argument;
    case "!":      return !      argument;
    case "~":      return ~      argument;
    case "typeof": return typeof argument;
    case "void":   return void   argument;
    case "delete": return delete argument;
  }
  return void 0;
};

exports.binary = (operator, left, right) => {
  switch (operator) {
    case "==":  return left ==  right;
    case "!=":  return left !=  right;
    case "===": return left === right;
    case "!==": return left !== right;
    case "<":   return left <   right;
    case "<=":  return left <=  right;
    case ">":   return left >   right;
    case ">=":  return left >=  right;
    case "<<":  return left <<  right;
    case ">>":  return left >>  right;
    case ">>>": return left >>> right;
    case "+":   return left +   right;
    case "-":   return left -   right;
    case "*":   return left *   right;
    case "/":   return left /   right;
    case "%":   return left %   right;
    case "|":   return left |   right;
    case "^":   return left ^   right;
    case "&":   return left &   right;
    case "in":  return left in  right;
    case "instanceof": return left instanceof right;
  }
  return void 0;
};

exports.builtins = {};

exports.object = (prototype, bindings) => {
  const object = {__proto__: null};
  for (let index = 0; index < bindings.length; index ++) {
    object[bindings[0]] = bindings[1];
  }
  return object;
};
