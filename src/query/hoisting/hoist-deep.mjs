import { concat, flatMap } from "array-lite";

import { constant_, deadcode_, partialx_x } from "../../util/index.mjs";

import { applyVisitor } from "../visit.mjs";

import { makeVarDeclaration, exportDeclaration } from "./declaration.mjs";

import {
  hoistExportSpecifier,
  hoistVariableDeclaration,
  hoistExportVariableDeclaration,
} from "./helper.mjs";

const getConsequent = ({ consequent }) => consequent;

const returnEmpty = constant_([]);

/* eslint-disable no-use-before-define */
const hoistBodyDeep = (node) => hoistDeep(node.body);
/* eslint-enable no-use-before-define */

export const hoistDeep = partialx_x(
  applyVisitor,
  {
    // Atomic //
    DebuggerStatement: returnEmpty,
    BreakStatement: returnEmpty,
    EmptyStatmeent: returnEmpty,
    ReturnStatement: returnEmpty,
    ThrowStatemnt: returnEmpty,
    EmptyStatement: returnEmpty,
    ExpressionStatement: returnEmpty,
    // Compound //
    BlockStatement: (node) => flatMap(node.body, hoistDeep),
    LabeledStatemnt: hoistBodyDeep,
    WithStatement: hoistBodyDeep,
    WhileStatement: hoistBodyDeep,
    DoWhileStatement: hoistBodyDeep,
    ForStatement: (node) =>
      node.init !== null && node.init.type === "VariableDeclaration"
        ? concat(hoistDeep(node.init), hoistDeep(node.body))
        : hoistDeep(node.body),
    ForInStatement: (node) =>
      node.left.type === "VariableDeclaration"
        ? concat(hoistDeep(node.left), hoistDeep(node.body))
        : hoistDeep(node.body),
    ForOfStatement: (node) =>
      node.left.type === "VariableDeclaration"
        ? concat(hoistDeep(node.left), hoistDeep(node.body))
        : hoistDeep(node.body),
    TryStatement: (node) =>
      concat(
        hoistDeep(node.block),
        node.handler === null ? [] : hoistDeep(node.handler.body),
        node.finalizer === null ? [] : hoistDeep(node.finalizer),
      ),
    IfStatement: (node) =>
      node.alternate === null
        ? hoistDeep(node.consequent)
        : concat(hoistDeep(node.consequent), hoistDeep(node.alternate)),
    SwitchStatement: (node) =>
      flatMap(flatMap(node.cases, getConsequent), hoistDeep),
    // Declaration //
    ImportDeclaration: returnEmpty,
    ExportAllDeclaration: returnEmpty,
    ClassDeclaration: returnEmpty,
    ExportDefaultDeclaration: (node) => {
      if (
        node.declaration.type === "FunctionDeclaration" &&
        node.declaration.id !== null
      ) {
        return [
          exportDeclaration(
            makeVarDeclaration(node.declaration.id.name),
            "default",
          ),
        ];
      } else {
        return [];
      }
    },
    ExportNamedDeclaration: (node) => {
      if (node.source !== null) {
        return [];
      } else if (node.declaration !== null) {
        if (node.declaration.type === "FunctionDeclaration") {
          return [
            exportDeclaration(
              makeVarDeclaration(node.declaration.id.name),
              node.declaration.id.name,
            ),
          ];
        } else if (
          node.declaration.type === "VariableDeclaration" &&
          node.declaration.kind === "var"
        ) {
          return hoistExportVariableDeclaration(node.declaration);
        } else {
          return [];
        }
      } else {
        return flatMap(node.specifiers, hoistExportSpecifier);
      }
    },
    VariableDeclaration: (node) => {
      if (node.kind === "var") {
        return hoistVariableDeclaration(node);
      } else {
        return [];
      }
    },
    FunctionDeclaration: (node) => [makeVarDeclaration(node.id.name)],
  },
  deadcode_("invalid node type"),
);
