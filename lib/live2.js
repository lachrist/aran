exports.builtins = {
  __proto__: null,
  "global": (new Function("return this"))(),
  "eval": eval,
  "RegExp": RegExp,
  "ReferenceError": ReferenceError,
  "TypeError": TypeError,
  "Reflect.get": Reflect.get,
  "Reflect.set": Reflect.set,
  "Reflect.has": Reflect.has,
  "Reflect.construct": Reflect.construct,
  "Reflect.apply": Reflect.apply,
  "Reflect.deleteProperty": Reflect.deleteProperty,
  "Reflect.setPrototypeOf": Reflect.setPrototypeOf,
  "Reflect.getPrototypeOf": Reflect.getPrototypeOf,
  "Reflect.defineProperty": Reflect.defineProperty,
  "Reflect.getOwnPropertyDescriptor": Reflect.getOwnPropertyDescriptor,
  "Symbol.unscopables": Symbol.unscopables,
  "Symbol.iterator": Symbol.iterator,
  "Object": Object,
  "Object.freeze": Object.freeze,
  "Object.keys": Object.keys,
  "Object.create": Object.create,
  "Object.prototype": Object.prototype,
  "Array.of": Array.of,
  "Array.prototype.concat": Array.prototype.concat,
  "Array.prototype.values": Array.prototype.values,
  "Array.prototype.includes": Array.prototype.includes,
  "Array.prototype.push": Array.prototype.push,
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get": Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get,
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set": Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set,
};

exports.unary = (operator, argument) => {
  switch (operator) {
    case "-": return - argument;
    case "+": return + argument;
    case "!": return ! argument;
    case "~": return ~ argument;
    case "typeof": return typeof argument;
    case "void": return void argument;
    case "delete": return delete argument;
  }
  return void 0;
};

exports.binary = (operator, argument1, argument2) => {
  switch (operator) {
    case "==": return argument1 == argument2;
    case "!=": return argument1 != argument2;
    case "===": return argument1 === argument2;
    case "!==": return argument1 !== argument2;
    case "<": return argument1 < argument2;
    case "<=": return argument1 <= argument2;
    case ">": return argument1 > argument2;
    case ">=": return argument1 >= argument2;
    case "<<": return argument1 << argument2;
    case ">>": return argument1 >> argument2;
    case ">>>": return argument1 >>> argument2;
    case "+": return argument1 + argument2;
    case "-": return argument1 - argument2;
    case "*": return argument1 * argument2;
    case "/": return argument1 / argument2;
    case "%": return argument1 % argument2;
    case "|": return argument1 | argument2;
    case "^": return argument1 ^ argument2;
    case "&": return argument1 & argument2;
    case "in": return argument1 in argument2;
    case "instanceof": return argument1 instanceof argument2;
  }
  return void 0;
};

exports.object = (prototype, bindings) => {
  const object = {__proto__: null};
  for (let index = 0; index < bindings.length; index ++) {
    object[bindings[0]] = bindings[1];
  }
  return object;
};

