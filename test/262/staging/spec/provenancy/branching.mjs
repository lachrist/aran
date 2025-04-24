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
  ImportDeclaration: null, // 32
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
 * ) => import("./branch.d.ts").Branch[]}
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
      prov: data[index * 3 + 2],
    }),
  );
};

/**
 * @type {(
 *   branches: import("./branch.d.ts").Branch[],
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
        const { path, type, prov } = branches[(index - rest) / 3];
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
            return prov;
          }
          default: {
            throw new AranExecError("Invalid rest", { rest });
          }
        }
      },
    ),
  );
