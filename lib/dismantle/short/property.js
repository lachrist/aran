
const Build = require("../build.js");
const Throw = require("./throw.js");

exports.get = (expression, expression) => Build.apply(
  Build.builtin("Reflect.get"),
  Build.primitive(void 0),
  [expression1, expression2]);

exports.delete = (strict, expression1, expression2) => (
  strict ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.deleteProperty"),
      Build.primitive(void 0),
      [expression1, expression2]),
    Build.primitive(true),
    Throw.throw("TypeError", "Cannot delete object property")) :
  Build.apply(
    Build.builtin("Reflect.deleteProperty"),
    Build.primitive(void 0),
    [expression1, expression2]));

exports.set = (strict, expression1, expression2, expression3) => (
  strict ?
  Build.conditional(
    Build.apply(
      Build.builtin("Reflect.set"),
      Build.primitive(void 0),    
      [expression1, expression2, expression3]),
    Build.primitive(void 0),
    Throw.throw("TypeError", "Cannot assign object property")) :
  Build.apply(
    Build.builtin("Reflect.set"),
    Build.primitive(void 0),
    [expression1, expression2, expression3])),
