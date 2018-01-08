
const etypes = [
  "ThisExpression",
  "Identifier",
  "AssignmentExpression",
  "ArrayExpression",
  "ObjectExpression",
  "FunctionExpression",
  "UnaryExpression",
  "Literal",
  "MemberExpression",
  "ConditionalExpression",
  "BinaryExpression",
  "UnaryExpression",
  "NewExpression",
  "CallExpression",
  "SequenceExpression"
];

const stypes = [
  "BlockStatement",
  "ExpressionStatement",
  "ReturnStatement",
  "ThrowStatement",
  "TryStatement",
  "VariableDeclaration",
  "IfStatement",
  "LabeledStatement",
  "BreakStatement",
  "ContinueStatement",
  "WhileStatement",
  "DebuggerStatement",
  "SwitchStatement"
];

const kinds = ["var", "let", "const"];

const unaries = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void"
];

const binaries = [
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof",
  ".."
];

exports.identifier = (identifier) => {
  if (typeof identifier !== "string")
    throw new Error("[identifier] is not a string: "+identifier);
  if (!/^[$_a-zA-Z][$_a-zA-Z]*$/.test(identifier))
    throw new Error("[identifier] not a valid: "+identifier)
};

exports.expression = (expression) => {
  if (typeof expression !== "object" || expression === null)
    throw new Error("[expression] not an object: "+expression);
  if (!etypes.includes(expression.type))
    throw new Error("[expression] unknwon type: "+expression);
};

exports.statement = (statement) => {
  if (typeof statement !== "object" || statement === null)
    throw new Error("[statement] not an object: "+statement);
  if (!stypes.includes(statement.type))
    throw new Error("[statement] unknown type: "+statement);
};

exports.primitive = (primitive) => {
  if (primitive && primitive !== true && typeof primitive !== "number" && typeof primitive !== "string")
    throw new Error("[primitive] type error: "+primitive);
};

exports.string = (boolean) => {
  if (typeof boolean !== "boolean")
    throw new Error("[boolean] type error: "+boolean);
};

exports.string = (string) => {
  if (typeof string !== string)
    throw new Error("[string] type error: "+string);
}

exports.unary = (unary) => {
  if (!unaries.includes(unary))
    throw new Error("[unary] unknown: "+unary);
};

exports.binary = (binary) => {
  if (!binaries.includes(binary))
    throw new Error("[binary] unknown: "+binary);
};

exports.kind = (kind) => {
  if (!kinds.includes(kind))
    throw new Error("[kind] unknown: "+kind);
};
