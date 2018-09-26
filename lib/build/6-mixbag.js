
module.exports = (format) => ({
  primitive: (primitive) => (
    primitive === void 0 ?
    format.build.unary(
      "void",
      format.build.primitive(0))),
  object_closure: (object, statements) => format.apply(
    format.load("Object.defineProperty"),
    [
      format.apply(
        format.load("Object.defineProperty"),
        [
          (
            object.arrow ?
            format.apply(
              format.load("Object.defineProperty"),
              [
                format.closure(statements),
                format.primitive("prototype"),
                format.object(
                  [
                    [
                      "value",
                      format.primitive(void 0)],
                    [
                      "writable",
                      format.primitive(true)]])]) :
            format.closure(statements)),
          format.primitive("name"),
          format.object(
            [
              [
                "value",
                format.primitive(object.name)],
              [
                "configurable",
                format.primitive(true)]])]),
      format.primitive("length"),
      format.object(
        [
          [
            "value",
            format.primitive(object.length)],
          [
            "configurable",
            format.primitive(true)]])])
  strict_set: (expression1, expression2, expression3) => format.apply(
    format.closure(
      null,
      format.If(
        format.get(
          format.read("arguments"),
          format.primitive(1)),
        [],
        format.Throw(
          format.construct(
            format.load("TypeError"),
            [
              format.primitive("Cannot assign object property")])))),
    [
      format.apply(
        format.load("Reflect.set"),
        [
          expression1,
          expression2,
          expression3])])
  strict_delete: (expression1, expression2) => format.apply(
    format.closure(
      null,
      format.If(
        format.get(
          format.read("arguments"),
          format.primitive(1)),
        format.Return(
          format.get(
            format.read("arguments"),
            format.primitive(1))),
        format.Throw(
          format.construct(
            format.load("TypeError"),
            [
              format.primitive("Cannot delete object property")])))),
    [
      format.apply(
        format.load("Reflect.deletePropery"),
        [
          format.apply(
            format.load("Object"),
            [
              expression1]),
          expression2,
          expression3])]),
  declare: (kind, identifier, expression) => format.hoist(
    format.Declare(
      kind,
      identifier,
      format.primitive(void 0)),
    format.write(
      identifier,
      expression)),
  eval: (expression) => format.apply(
    format.read("eval"),
    [
      expression]),
  invoke: (expression1, expression2, expressions) => format.apply(
    format.get(expression1, expression2),
    expressions),
  delete: (expression1, expression2) => format.unary(
    "delete",
    format.get(expression1, expression2)),
  discard: (identifier) => format.unary(
    "delete",
    format.read(identifier))
});
