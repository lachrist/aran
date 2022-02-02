import {flatMap, map} from "array-lite";
import {collectDeclarator} from "./collect.mjs";
import {
  makeLetDeclaration,
  makeConstDeclaration,
  makeClassDeclaration,
} from "./declaration.mjs";

const makers = {
  __proto__: null,
  const: makeConstDeclaration,
  let: makeLetDeclaration,
};

export const hoistShallow = (node) => {
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
