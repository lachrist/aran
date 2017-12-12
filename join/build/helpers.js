
const nonempty = (statement) => statements.type !== "EmptyStatement";

exports.unary = (operator, expression) => ({
  type: "UnaryExpression",
  operator: operator,
  argument: expression});

exports.Block = (statements) => ({
  type: "BlockStatement",
  body: statements.filter(nonempty)});

exports.identifier = (string) => ({
  type: "Identifier",
  name: string});

exports.array = (expressions) => ({
  type: "ArrayExpression",
  elements: expressions});

exports.member = (expression1, expression2) => ({
  type: "MemberExpression",
  computed: typeof expression2 !== "string",
  object: expression1, 
  property: typeof expression2 === "string" ?
    {
      type: "Identifier",
      name: expression2} :
    expression2});

exports.literal = (value) => ({
  type: "Literal",
  value: value});
