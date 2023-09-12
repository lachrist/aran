import { filter, filterOut } from "../util/index.mjs";

/** @type {(node: estree.Node) => boolean} */
const isHoisted = (node) =>
  node.type === "FunctionDeclaration" ||
  (node.type === "LabeledStatement" && isHoisted(node.body)) ||
  ((node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration") &&
    node.declaration != null &&
    node.declaration.type === "FunctionDeclaration");

/** @type {<N extends estree.Node>(nodes: N[]) => N[]} */
export const sortBody = (nodes) => [
  ...filter(nodes, isHoisted),
  ...filterOut(nodes, isHoisted),
];
