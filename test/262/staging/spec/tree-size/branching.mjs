/* eslint-disable no-bitwise */

import { AranExecError } from "../../../error.mjs";
import { listEntry, listKey, mapIndex, reduceEntry } from "../../helper.mjs";

const {
  Error,
  JSON,
  Array,
  Array: { from: toArray },
} = globalThis;

// https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function

const fnv_offset_basis_32 = 2166136261;
const fnv_prime_32 = 16777619;

/**
 * @type {(
 *   content: string,
 * ) => number}
 */
const hashFowler32 = (content) => {
  let hash = fnv_offset_basis_32;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash *= fnv_prime_32;
    hash >>>= 0; // Ensure 32-bit unsigned
  }
  return hash;
};

/**
 * @type {(
 *   input: number,
 * ) => number}
 */

const hashXor16 = (input) => ((input >>> 16) ^ input) & 0xffff;

/**
 * @type {{
 *   [k in import("aran").EstreeNode<{}>["type"]]: null
 * }}
 */
const node_type_record = {
  ArrayExpression: null,
  ArrayPattern: null,
  ArrowFunctionExpression: null,
  AssignmentExpression: null,
  AssignmentPattern: null,
  AwaitExpression: null,
  BinaryExpression: null,
  BlockStatement: null,
  BreakStatement: null,
  CallExpression: null,
  CatchClause: null,
  ChainExpression: null,
  ClassBody: null,
  ClassDeclaration: null,
  ClassExpression: null,
  ConditionalExpression: null,
  ContinueStatement: null,
  DebuggerStatement: null,
  DoWhileStatement: null,
  EmptyStatement: null,
  ExportAllDeclaration: null,
  ExportDefaultDeclaration: null,
  ExportNamedDeclaration: null,
  ExportSpecifier: null,
  ExpressionStatement: null,
  ForInStatement: null,
  ForOfStatement: null,
  ForStatement: null,
  FunctionDeclaration: null,
  FunctionExpression: null,
  Identifier: null,
  IfStatement: null,
  ImportDeclaration: null,
  ImportDefaultSpecifier: null,
  ImportExpression: null,
  ImportNamespaceSpecifier: null,
  ImportSpecifier: null,
  LabeledStatement: null,
  Literal: null,
  LogicalExpression: null,
  MemberExpression: null,
  MetaProperty: null,
  MethodDefinition: null,
  NewExpression: null,
  ObjectExpression: null,
  ObjectPattern: null,
  PrivateIdentifier: null,
  Program: null,
  Property: null,
  PropertyDefinition: null,
  RestElement: null,
  ReturnStatement: null,
  SequenceExpression: null,
  SpreadElement: null,
  Super: null,
  SwitchCase: null,
  SwitchStatement: null,
  TaggedTemplateExpression: null,
  TemplateElement: null,
  TemplateLiteral: null,
  ThisExpression: null,
  ThrowStatement: null,
  TryStatement: null,
  StaticBlock: null,
  UnaryExpression: null,
  UpdateExpression: null,
  VariableDeclaration: null,
  VariableDeclarator: null,
  WhileStatement: null,
  WithStatement: null,
  YieldExpression: null,
};

const node_type_enum = listKey(node_type_record);

/**
 * @type {{
 *   [k in import("aran").EstreeNode<{}>["type"]]: number
 * }}
 */
const node_type_hash = reduceEntry(
  mapIndex(listEntry(node_type_record), ({ 0: type, 1: _ }, index) => [
    type,
    index,
  ]),
);

/**
 * @type {(
 *   content: string,
 * ) => import("./branch").Branch[]}
 */
export const parseBranching = (content) => {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error("not an array", { cause: data });
  }
  if (data.length % 3 !== 0) {
    throw new Error("invalid length", { cause: data });
  }
  return toArray(
    {
      // @ts-ignore
      __proto__: null,
      length: data.length / 3,
    },
    (_, index) => ({
      path: data[index * 3],
      type: node_type_enum[data[index * 3 + 1]],
      size: data[index * 3 + 2],
    }),
  );
};

/**
 * @type {(
 *   branches: import("./branch").Branch[],
 * ) => string}
 */
export const printBranching = (branches) =>
  JSON.stringify(
    toArray(
      {
        // @ts-ignore
        __proto__: null,
        length: 3 * branches.length,
      },
      (_, index) => {
        const rest = index % 3;
        const { path, type, size } = branches[index - rest / 3];
        switch (rest) {
          case 0: {
            return typeof path === "string"
              ? hashXor16(hashFowler32(path))
              : path;
          }
          case 1: {
            return node_type_hash[type];
          }
          case 2: {
            return size;
          }
          default: {
            throw new AranExecError("Invalid rest", { rest });
          }
        }
      },
    ),
  );
