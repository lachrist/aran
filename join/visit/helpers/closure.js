
const Context = require("../context.js");
const Build = require("../build.js");

const concat = Array.prototype.concat;
const push = Array.prototype.push;

module.exports = (ast) => {
  const temporary = ARAN.context;
  ARAN.context = Context(
    ast.body.type === "BlockStatement" && ast.body.body[0]);
  const statements1 = [];
  statements1.push(
    ARAN.cut.Closure(
      ARAN.context.strict));
  statements1.push(Build.Declare(
    "var",
    Hide("arguments"),
    ARAN.cut.arguments()));
  if (ast.type === "ArrowExpression") {
    statements1.push(
      Build.Statement(
        ARAN.cut.this()));
    statements1.push(
      ARAN.cut.drop());
  } else {
    statements1.push(ARAN.cut.Declare(
      "let",
      "arguments",
      ARAN.cut.copy0.before(
        Hide("arguments"))));
    statements1.push(ARAN.cut.Declare(
      "const",
      "this",
      ARAN.cut.this()));
  }
  if (ast.params.length && ast.params[ast.params.length-1].type === "RestElement") {
    push.apply(
      statements1,
      Assignment(
        "let",
        {
          type: "ArrayPattern",
          elements: ast.params },
        Hide("arguments")));
  } else {
    ast.params.forEach(
      (pattern, index) => push.apply(
        statements1,
        Assignment(
          "let",
          pattern,
          ARAN.cut.get(
            ARAN.cut.copy0.before(
              Hide("arguments")),
            ARAN.cut.primitive(index)))));
    statements1.push(
      ARAN.cut.Drop());
  }
  const statements2 = ast.body.type === "BlockStatement" ?
    concat.call(
      concat.apply(
        [],
        ast.body.body.map(Visit.Statement)),
      [ARAN.cut.Return(
        Aran.cut.primitive(void 0))]) :
    ARAN.cut.Return(
      Visit.expression(ast.body));
  const result = ARAN.cut.closure(
    ast.id ? ast.id.name : null,
    [],
    []
    concat.call(
      ARAN.context.strict ? [Build.Strict()] :[],
      ARAN.context.hidden.map((identifier) => Build.Declaration("let", identifier, null)),
      statements1,
      ARAN.context.hoisted,
      statements2));
  ARAN.closure = temporary;
  return result;
};
