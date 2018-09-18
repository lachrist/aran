
exports.get = (expression1, expression2) => ARAN.cut.apply(
  ARAN.cut.builtin("Reflect.get"),
  [
    ARAN.cut.apply(
      ARAN.cut.builtin("Object"),
      [expression1]),
    expression2]); 
