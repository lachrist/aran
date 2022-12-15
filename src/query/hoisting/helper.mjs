import { map, flatMap, filter } from "array-lite";

import { partialx_x, deadcode_ } from "../../util/index.mjs";

import { applyVisitor } from "../visit.mjs";

import {
  makeVoidDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
  makeVarDeclaration,
  exportDeclaration,
} from "./declaration.mjs";

////////////////////
// collectPattern //
////////////////////

const isNotNull = (any) => any !== null;

export const collectPattern = partialx_x(
  applyVisitor,
  {
    Identifier: (node) => [node.name],
    AssignmentPattern: (node) => collectPattern(node.left),
    RestElement: (node) => collectPattern(node.argument),
    ArrayPattern: (node) =>
      flatMap(filter(node.elements, isNotNull), collectPattern),
    Property: (node) => collectPattern(node.value),
    ObjectPattern: (node) => flatMap(node.properties, collectPattern),
  },
  deadcode_("invalid Pattern type"),
);

//////////////////////////
// visitExportSpecifier //
//////////////////////////

export const hoistExportSpecifier = partialx_x(
  applyVisitor,
  {
    ExportSpecifier: (node) => [
      exportDeclaration(
        makeVoidDeclaration(node.local.name),
        node.exported.name,
      ),
    ],
  },
  deadcode_("invalid export specifier type"),
);

//////////////////////////////
// visitVariableDeclaration //
//////////////////////////////

const getDeclaratorPattern = ({ id }) => id;

const generateVisitVariableDeclaration = (makers) => (node) =>
  map(
    flatMap(map(node.declarations, getDeclaratorPattern), collectPattern),
    makers[node.kind],
  );

const generateMakeExportSelfDeclaration = (makeDeclaration) => (variable) =>
  exportDeclaration(makeDeclaration(variable), variable);

export const hoistVariableDeclaration = generateVisitVariableDeclaration({
  __proto__: null,
  var: makeVarDeclaration,
  let: makeLetDeclaration,
  const: makeConstDeclaration,
});

export const hoistExportVariableDeclaration = generateVisitVariableDeclaration({
  __proto__: null,
  var: generateMakeExportSelfDeclaration(makeVarDeclaration),
  let: generateMakeExportSelfDeclaration(makeLetDeclaration),
  const: generateMakeExportSelfDeclaration(makeConstDeclaration),
});
