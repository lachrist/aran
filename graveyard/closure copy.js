
const nameof = (expression) => {};

exports.closure = (scope1, expression) => {
  const scope2 = Scope.arrow(expression.patterns, scope1);
  const $statements1 = Pattern.Declare(
    scope2,
    {
      type: "ArrayPattern",
      elements: expression.patterns},
    ARAN.cut.input("arguments"));
  const scope3 = Scope.body(expression.expression ? [] : expression.body.body, scope2);
  const $statements2 = ArrayLite.concat(
    ArrayLite.flatMap(
      Scope.variables(scope3),
      (name) => Identifier.Declare(
        scope3,
        name,
        ARAN.cut.primitive(void 0))),
    (
      expression.expression ?
      ARAN.cut.Return(
        Visit.expression(scope3, expression.body)) :
      ArrayLite.flatMap(
        expression.body.body,
        (statement) => Visit.statement(scope3, statement))),
    ARAN.cut.Return(
      ARAN.cut.primitive(void 0)));
  const expression = ARAN.cut.closure(
    Scope.identifiers(scope2),
    ArrayLite.concat(
      statements1,
      ARAN.cut.Block(
        ARAN.cut.BLOCK(
          "body",
          Scope.identifiers(scope3),
          statements2))));
  return ARAN.cut.apply(
    ARAN.cut.builtin("Object.defineProperty"),
    ARAN.cut.primitive(void 0),
    [
      ARAN.cut.apply(
        ARAN.cut.builtin("Object.defineProperty"),
        ARAN.cut.primitive(void 0),
        [
          expression,
          ARAN.cut.primitive("length"),
          ARAN.cut.apply(
            ARAN.cut.builtin("AranReflect.initialize"),
            ARAN.cut.primitive(void 0),
            [
              ARAN.cut.primitive("init"),
              ARAN.cut.primitive("value"),
              ARAN.cut.primitive(
                (
                  (
                    expression.patterns.length &&
                    expression.patterns[expression.patterns.lenght-1].type === "SpreadElement"))),
              ARAN.cut.primitive("init"),
              ARAN.cut.primitive("configurable"),
              ARAN.cut.primitive(true)])]),
      ARAN.cut.primitive("name"),
      ARAN.cut.apply(
        ARAN.cut.builtin("AranReflect.initialize"),
        ARAN.cut.primitive(void 0),
        [
          ARAN.cut.primitive("init"),
          ARAN.cut.primitive(name),
          ARAN.cut.primitive(nameof(expression)),
          ARAN.cut.primitive("init"),
          ARAN.cut.primitive("configurable"),
          ARAN.cut.primitive(true)])]);
};


