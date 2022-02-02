import {flatMap, filter} from "array-lite";

const {
  Object: {assign},
} = globalThis;

const isNotNull = (any) => any !== null;

const visitors = {__proto__: null};

export const collectPattern = (pattern) => {
  const visitor = visitors[pattern.type];
  return visitor(pattern);
};

export const collectDeclarator = (declarator) => collectPattern(declarator.id);

assign(visitors, {
  __proto__: null,
  Identifier: (node) => [node.name],
  AssignmentPattern: (node) => collectPattern(node.left),
  RestElement: (node) => collectPattern(node.argument),
  ArrayPattern: (node) =>
    flatMap(filter(node.elements, isNotNull), collectPattern),
  Property: (node) => collectPattern(node.value),
  ObjectPattern: (node) => flatMap(node.properties, collectPattern),
});
