import {flatMap, map} from "array-lite";
import {collectDeclarator} from "./collect.mjs";
import {
  makeLetDeclaration,
  makeConstDeclaration,
  makeClassDeclaration,
} from "./data.mjs";

const getConsequent = ({consequent}) => consequent;

const makers = {
  __proto__: null,
  const: makeConstDeclaration,
  let: makeLetDeclaration,
};

const visit = (node) => {
  if (node.type === "VariableDeclaration") {
    if (node.kind !== "var") {
      return map(
        flatMap(node.declarations, collectDeclarator),
        makers[node.kind],
      );
    } else {
      return [];
    }
  } else if (node.type === "ClassDeclaration") {
    return [makeClassDeclaration(node.id.name)];
  } else {
    return [];
  }
};

export const hoistSwitchStatement = (node) => {
  assert(node.type === "SwitchStatement", "expecteed switch statement");
  return flatMap(flatMap(node.cases, getConsequent), visit);
};

export const hoistBlockStatement = (node) => {
  assert(node.type === "BlockStatement", "expected block statement");
  return flatMap(node.body, visit);
};
