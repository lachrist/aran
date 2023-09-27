import { map, flatMap, filter } from "array-lite";
import { partialx_ } from "../../util/index.mjs";
import { dispatchObjectNode0 } from "../../node.mjs";
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

export const collectPattern = partialx_(dispatchObjectNode0, {
  Identifier: (node) => [node.name],
  AssignmentPattern: (node) => collectPattern(node.left),
  RestElement: (node) => collectPattern(node.argument),
  ArrayPattern: (node) =>
    flatMap(filter(node.elements, isNotNull), collectPattern),
  Property: (node) => collectPattern(node.value),
  ObjectPattern: (node) => flatMap(node.properties, collectPattern),
});

//////////////////////////
// visitExportSpecifier //
//////////////////////////

export const hoistExportSpecifier = partialx_(dispatchObjectNode0, {
  ExportSpecifier: (node) => [
    exportDeclaration(makeVoidDeclaration(node.local.name), node.exported.name),
  ],
});

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
