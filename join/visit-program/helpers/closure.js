
const Context = require("../../context.js");

exports.closure = (node) => {
  const temporary = ARAN.context;
  ARAN.context = Context(
    ast.body.type === "BlockStatement" && ast.body.body[0]);
  const statements1 = ArrayLite.concat(
    ARAN.cut.$Closure(
      ARAN.context.strict,
      node.type === "ArrowExpression"),
    (
      node.type === "ArrowExpression" ?
      [] :
      ARAN.cut.Declare(
        "var",
        "this",
        ARAN.cut.$this()),
    Build.Statement(
      Build.write(
        Hide("arguments"),
        ARAN.cut.$arguments()))),
    (
      node.type === "ArrowExpression" ?
      [] :
      ARAN.cut.Declare(
        "var",
        "arguments",
        ARAN.cut.copy0(
          Hide("arguments")))),
    (
      ArrayLite.all(
        node.params,
        (param) => param.type !== "SpreadElement") ?
      ArrayLite.map(
        node.params,
        (param, index) = Assign.Declare(
          "var",
          param,
          ARAN.cut.get(
            (
              index === params.length - 1 ?
              Build.read("arguments") :
              ARAN.cut.$copy0.before(
                Build.read("arguments"))),
            ARAN.cut.primitive(index)))) :
      Assign.Declare(
        "var",
        {
          type: "ArrayPattern",
          elements: params},
        Build.read("arguments"))));
  const statements2 = (
    node.body.type === "BlockStatement" ?
    ArrayLite.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          node.body.body,
          Visit.Statement)),
        ARAN.cut.Return(
          ARAN.cut.primitive(void 0))) :
    ARAN.cut.Return(
      Visit.expression(node.body)));
  const expression = ARAN.cut.closure(
    ARAN.context.strict,
    ARAN.concat(
      ArrayLite.flaten(
        ArrayLite.map(
          ARAN.concat.hidden,
          (identifier) => Build.Declaration(
            "var",
            identifier,
            Build.primitive(null)))),
      statements1,
      ArrayLite.flaten(ARAN.context.hoisted),
      statements2));
  ARAN.context = temporary;
  return (
    node.id ?
    ARAN.cut.apply(
      ARAN.cut.protect("defineProperty"),
      [
        expression,
        ARAN.cut.primitive("name"),
        ARAN.cut.object(
          [
            "value",
            ARAN.cut.primitive(node.id.name)],
          [
            "configurable",
            ARAN.cut.primitive(true)])]) :
    expression);
};
