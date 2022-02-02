import {concat, flatMap, map} from "array-lite";
import {makeFunctionDeclaration, makeVarDeclaration} from "./declaration.mjs";
import {collectDeclarator} from "./collect.mjs";

const {
  Object: {assign},
} = globalThis;

const visitors = {__proto__: null};

const visit = (node) => {
  const visitor = visitors[node.type];
  return visitor(node);
};

const visitEmpty = (_node) => [];

const visitBody = (node) => visit(node.body);

const generateVisitFor = (key) => (node) =>
  node[key] !== null && node[key].type === "VariableDeclaration"
    ? concat(visit(node[key]), visit(node.body))
    : visit(node.body);

const getConsequent = ({consequent}) => consequent;

assign(visitors, {
  __proto__: null,
  // Atomic //
  DebuggerStatement: visitEmpty,
  BreakStatement: visitEmpty,
  EmptyStatmeent: visitEmpty,
  ReturnStatement: visitEmpty,
  ThrowStatemnt: visitEmpty,
  EmptyStatement: visitEmpty,
  ExpressionStatement: visitEmpty,
  // Compound //
  BlockStatement: (node) => flatMap(node.body, visit),
  LabeledStatemnt: visitBody,
  WithStatement: visitBody,
  WhileStatement: visitBody,
  DoWhileStatement: visitBody,
  ForStatement: generateVisitFor("init"),
  ForInStatement: generateVisitFor("left"),
  ForOfStatement: generateVisitFor("left"),
  TryStatement: (node) =>
    concat(
      visit(node.block),
      node.handler === null ? [] : visit(node.handler.body),
      node.finalizer === null ? [] : visit(node.finalizer),
    ),
  IfStatement: (node) =>
    node.alternate === null
      ? visit(node.consequent)
      : concat(visit(node.consequent), visit(node.alternate)),
  SwitchStatement: (node) => flatMap(flatMap(node.cases, getConsequent), visit),
  // Declaration //
  ImportDeclaration: visitEmpty,
  ExportNamedDeclaration: visitEmpty,
  ExportAllDeclaration: visitEmpty,
  ExportDefaultDeclaration: visitEmpty,
  ClassDeclaration: visitEmpty,
  VariableDeclaration: (node) =>
    node.kind === "var"
      ? map(flatMap(node.declarations, collectDeclarator), makeVarDeclaration)
      : [],
  FunctionDeclaration: (node) => [makeFunctionDeclaration(node.id.name)],
});

export const hoistDeep = visit;
