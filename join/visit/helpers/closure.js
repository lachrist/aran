
const Context = require("../context.js");
const Build = require("../build.js");
const Assignment = require("./assignment.js");

module.exports = (node) => {
  const temporary = ARAN.context;
  ARAN.context = Context(
    ast.body.type === "BlockStatement" && ast.body.body[0]);
  const statementss1 = node.body.type === "BlockStatement" ?
    node.body.body.map(Visit.Statement) :
    [ARAN.cut.Return(Visit.expression(node.body))];
  const statementss2 = ARAN.context.hoisted;
  ARAN.context.hoisted = null;
  const statementss3 = (node.params[node.params.length-1]||{}).type === "RestElement" ?
    Assignment(
      "var",
      [
        [
          {
            type: "ArrayPattern",
            elements: params},
          Build.read("arguments")]]) :
    params.map((param, index) => Assignment(
      "var",
      [
        [
          param,
          ARAN.cut.get(
            ARAN.cut.Copy0.before(
              Build.read("arguments")),
            ARAN.cut.primitive(index))]]));
  const statementss4 = ARAN.context.hidden.map((identifier) => Build.Declare(
    "var",
    identifier,
    Build.primitive(null)));
  const expression = ARAN.cut.closure(
    ARAN.context.strict,
    Flaten.call(
      Flaten.apply(null, statementss4),
      Flaten.apply(null, statementss3),
      Flaten.apply(null, statementss2),
      Flaten.apply(null, statementss1)));
  ARAN.context = temporary;
  return node.id ?
    ARAN.cut.apply(
      ARAN.cut.protect("defineProperty"),
      ARAN.cut.primitive(null),
      [
        expression,
        ARAN.cut.primitive("name"),
        ARAN.cut.object(
          [
            "value",
            "value",
            ARAN.cut.primitive(node.id.name)],
          [
            "value",
            "configurable",
            ARAN.cut.primitive(true)])]) :
    expression;
};

// module.exports = (ast) => {
//   const temporary = ARAN.context;
//   ARAN.context = Context(
//     ast.body.type === "BlockStatement" && ast.body.body[0]);
//   const statements1 = [];
//   statements1.push(
//     ARAN.cut.Closure(
//       ARAN.context.strict));
//   statements1.push(Build.Declare(
//     "var",
//     Hide("arguments"),
//     ARAN.cut.arguments()));
//   if (ast.type === "ArrowExpression") {
//     statements1.push(
//       Build.Statement(
//         ARAN.cut.this()));
//     statements1.push(
//       ARAN.cut.drop());
//   } else {
//     statements1.push(ARAN.cut.Declare(
//       "let",
//       "arguments",
//       ARAN.cut.copy0.before(
//         Hide("arguments"))));
//     statements1.push(ARAN.cut.Declare(
//       "const",
//       "this",
//       ARAN.cut.this()));
//   }
//   if (ast.params.length && ast.params[ast.params.length-1].type === "RestElement") {
//     push.apply(
//       statements1,
//       Assignment(
//         "let",
//         {
//           type: "ArrayPattern",
//           elements: ast.params },
//         Hide("arguments")));
//   } else {
//     ast.params.forEach(
//       (pattern, index) => push.apply(
//         statements1,
//         Assignment(
//           "let",
//           pattern,
//           ARAN.cut.get(
//             ARAN.cut.copy0.before(
//               Hide("arguments")),
//             ARAN.cut.primitive(index)))));
//     statements1.push(
//       ARAN.cut.Drop());
//   }
//   const statements2 = ast.body.type === "BlockStatement" ?
//     concat.call(
//       concat.apply(
//         [],
//         ast.body.body.map(Visit.Statement)),
//       [ARAN.cut.Return(
//         Aran.cut.primitive(void 0))]) :
//     ARAN.cut.Return(
//       Visit.expression(ast.body));
//   const result = ARAN.cut.closure(
//     ast.id ? ast.id.name : null,
//     [],
//     []
//     concat.call(
//       ARAN.context.strict ? [Build.Strict()] :[],
//       ARAN.context.hidden.map((identifier) => Build.Declaration("let", identifier, null)),
//       statements1,
//       ARAN.context.hoisted,
//       statements2));
//   ARAN.closure = temporary;
//   return result;
// };
