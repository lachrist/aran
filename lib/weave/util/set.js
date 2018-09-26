
exports.set = (expression1, expression2, expression3) => (
  ARAN.node.AranStrict ?
  ARAN.build.apply(
    ARAN.build.closure(
      ARAN.cut.If(
        ARAN.build.get(
          ARAN.build.read("arguments"),
          ARAN.build.primitive(0)),
        [],
        ARAN.cut.Throw(
          ARAN.cut.construct(
            ARAN.cut.builtin("TypeError"),
            [
              ARAN.cut.primitive("cannot assign object property")])))),
    [
      ARAN.cut.apply(
        ARAN.cut.builtin("Reflect.set"),
        [expression1, expression2, expression3])]) :
  ARAN.build.sequence(
    [
      traps.set(expression1, expression2, expression3),
      traps.drop()]));
