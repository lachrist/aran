/* eslint-disable no-bitwise */

const { Error, parseInt, Reflect, Object } = globalThis;

const radix = 32;

/**
 * @type {{
 *   [k in import("aran").EstreeNode<{}>["type"]]: null
 * }}
 */
const node_type_record = {
  ArrayExpression: null, // 0
  ArrayPattern: null, // 1
  ArrowFunctionExpression: null, // 2
  AssignmentExpression: null, // 3
  AssignmentPattern: null, // 4
  AwaitExpression: null, // 5
  BinaryExpression: null, // 6
  BlockStatement: null, // 7
  BreakStatement: null, // 8
  CallExpression: null, // 9
  CatchClause: null, // 10
  ChainExpression: null, // 11
  ClassBody: null, // 12
  ClassDeclaration: null, // 13
  ClassExpression: null, // 14
  ConditionalExpression: null, // 15
  ContinueStatement: null, // 16
  DebuggerStatement: null, // 17
  DoWhileStatement: null, // 18
  EmptyStatement: null, // 19
  ExportAllDeclaration: null, // 20
  ExportDefaultDeclaration: null, // 21
  ExportNamedDeclaration: null, // 22
  ExportSpecifier: null, // 23
  ExpressionStatement: null, // 24
  ForInStatement: null, // 25
  ForOfStatement: null, // 26
  ForStatement: null, // 27
  FunctionDeclaration: null, // 28
  FunctionExpression: null, // 29
  Identifier: null, // 30
  IfStatement: null, // 31
  ImportDeclaration: null, // radix
  ImportDefaultSpecifier: null, // 33
  ImportExpression: null, // 34
  ImportNamespaceSpecifier: null, // 35
  ImportSpecifier: null, // 36
  LabeledStatement: null, // 37
  Literal: null, // 38
  LogicalExpression: null, // 39
  MemberExpression: null, // 40
  MetaProperty: null, // 41
  MethodDefinition: null, // 42
  NewExpression: null, // 43
  ObjectExpression: null, // 44
  ObjectPattern: null, // 45
  PrivateIdentifier: null, // 46
  Program: null, // 47
  Property: null, // 48
  PropertyDefinition: null, // 49
  RestElement: null, // 50
  ReturnStatement: null, // 51
  SequenceExpression: null, // 52
  SpreadElement: null, // 53
  Super: null, // 54
  SwitchCase: null, // 55
  SwitchStatement: null, // 56
  TaggedTemplateExpression: null, // 57
  TemplateElement: null, // 58
  TemplateLiteral: null, // 59
  ThisExpression: null, // 60
  ThrowStatement: null, // 61
  TryStatement: null, // 62
  StaticBlock: null, // 63
  UnaryExpression: null, // 64
  UpdateExpression: null, // 65
  VariableDeclaration: null, // 66
  VariableDeclarator: null, // 67
  WhileStatement: null, // 68
  WithStatement: null, // 69
  YieldExpression: null, // 70
};

/**
 * @type {(
 *   input: string,
 * ) => input is import("aran").EstreeNode<{}>["type"]}
 */
export const isNodeType = (input) => Object.hasOwn(node_type_record, input);

const node_type_enum = /** @type {import("aran").EstreeNode<{}>["type"][]} */ (
  Reflect.ownKeys(node_type_record)
);

const node_type_hash = /**
 * @type {{
 *   [k in import("aran").EstreeNode<{}>["type"]]: string
 * }}
 */ (
  Object.fromEntries(
    node_type_enum.map((type, index) => [type, index.toString(radix)]),
  )
);

/**
 * @type {(
 *   type: import("estree-sentry").Node<{}>["type"],
 *   prov: number,
 *   hash: number,
 * ) => string}
 */
export const printBranch = (type, prov, hash) =>
  `${node_type_hash[type]}|${prov.toString(radix)}|${hash.toString(radix)}\n`;

/**
 * @type {(
 *   line: string,
 * ) => import("./branch.d.ts").Branch}
 */
export const parseBranch = (line) => {
  const parts = line.split("|");
  const type_index = parseInt(parts[0], radix);
  const prov = parseInt(parts[1], radix);
  const hash = parseInt(parts[2], radix);
  return { type: node_type_enum[type_index], prov, hash };
};

/**
 * @type {(
 *   input: string,
 * ) => number}
 */
export const digestDJB2 = (input) => {
  let hash = 5381;
  const { length } = input;
  for (let index = 0; index < length; index++) {
    hash = (hash << 5) + hash + input.charCodeAt(index);
  }
  return hash >>> 0;
};

/**
 * @type {(
 *   prov: number,
 *   hash: import("./location.d.ts").NodeHash,
 * ) => string}
 */
export const digestBranch = (prov, hash) => {
  const parts = hash.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid node hash", { cause: hash });
  }
  const type = /** @type {import("estree-sentry").Node<{}>["type"]} */ (
    parts[0]
  );
  const path = parts[1];
  return printBranch(type, prov, digestDJB2(path));
};
