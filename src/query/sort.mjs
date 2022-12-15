import { concat, filter, filterOut } from "array-lite";

const isHoisted = (node) =>
  node.type === "FunctionDeclaration" ||
  (node.type === "LabeledStatement" && isHoisted(node.body)) ||
  ((node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration") &&
    node.declaration !== null &&
    node.declaration.type === "FunctionDeclaration");

export const sortBody = (nodes) =>
  concat(filter(nodes, isHoisted), filterOut(nodes, isHoisted));
