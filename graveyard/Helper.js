
exports.get = (expression1, expression2) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.get"),
  ARAN.cut.primitive(void 0),
  [expression1, expression2]);

exports.set = (expression1, expression2, expression3) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.set"),
  ARAN.cut.primitive(void 0),
  [expression1, expression2, expression3]);

exports.deleteProperty = (expression1, expression2) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.deleteProperty"),
  ARAN.cut.

exports.unary = (operator, expression) => ARAN.cut.apply(
  ARAN.cut.builtin("AranReflect.unary"),
  ARAN.cut.primitive(void 0),
  [
    ARAN.cut.primitive(operator),
    expression]);

exports.binary = (operator, expression1, expression2) => ARAN.cut.apply(
  ARAN.cut.builtin("AranReflect.binary"),
  ARAN.cut.primitive(void 0),
  [
    ARAN.cut.primitive(operator),
    expression1,
    expression2]);

exports.Completion = (boolean, statements) => ArrayLite.concat(
  (
    boolean ?
    ARAN.cut.Write(
      0,
      ARAN.cut.primitive(void 0)) :
    []),
  statements);