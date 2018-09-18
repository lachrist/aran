
const Util = require("util");
const ArrayLite = require("array-lite");

const etypes = [
  "MetaProperty",
  "ThisExpression",
  "Identifier",
  "AssignmentExpression",
  "ArrayExpression",
  "ObjectExpression",
  "FunctionExpression",
  "ArrowFunctionExpression",
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
  "WhileStatement",
  "DebuggerStatement",
  "SwitchStatement",
  "WithStatement"
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
  "**",
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

exports.identifier = (value) => {
  if (typeof value !== "string")
    throw new Error("[identifier] is not a string: "+Util.inspect(value));
  if (!/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(value) && value !== "new.target")
    throw new Error("[identifier] invalid: "+Util.inspect(value))
};

exports.label = (value) => {
  if (typeof value !== "string")
    throw new Error("[label] is not a string: "+Util.inspect(value));
  if (!/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(value))
    throw new Error("[label] invalid: "+Util.inspect(value))
};

exports.expression = (value) => {
  if (typeof value !== "object" || value === null)
    throw new Error("[expression] not an object: "+Util.inspect(value));
  if (!ArrayLite.includes(etypes, value.type))
    throw new Error("[expression] unknwon type: "+Util.inspect(value));
};

exports.statement = (value) => {
  if (typeof value !== "object" || value === null)
    throw new Error("[statement] not an object: "+Util.inspect(value));
  if (!ArrayLite.includes(stypes, value.type))
    throw new Error("[statement] unknown type: "+Util.inspect(value));
};

exports.primitive = (value) => {
  if (value && value !== true && typeof value !== "number" && typeof value !== "string")
    throw new Error("[primitive] type error: "+Util.inspect(value));
};

exports.null = (value) => {
  if (value !== null)
    throw new Error("[null] not null: "+Utio.inspect(value))
};

exports.boolean = (value) => {
  if (typeof value !== "boolean")
    throw new Error("[boolean] type error: "+Util.inspect(value));
};

exports.string = (value) => {
  if (typeof value !== "string")
    throw new Error("[string] type error: "+Util.inspect(value));
}

exports.unary = (value) => {
  if (!ArrayLite.includes(unaries, value))
    throw new Error("[unary] unknown: "+Util.inspect(value));
};

exports.binary = (value) => {
  if (!ArrayLite.includes(binaries, value))
    throw new Error("[binary] unknown: "+Util.inspect(value));
};

exports.kind = (kind) => {
  if (!ArrayLite.includes(kinds, kind))
    throw new Error("[kind] unknown: "+Util.inspect(kind));
};
