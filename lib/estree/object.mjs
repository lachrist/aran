/** @type {(node: estree.Node) => boolean} */
export const isProtoKey = (node) => {
  if (node.type === "Identifier") {
    return node.name === "__proto__";
  } else if (node.type === "Literal") {
    return node.value === "__proto__";
  } /* c8 ignore start */ else {
    return false;
  } /** c8 ignore stop */
};

/** @type {(node: estree.Node) => boolean} */
export const isPrototypeProperty = (node) =>
  node.type === "Property" &&
  node.kind === "init" &&
  !node.method &&
  !node.computed &&
  isProtoKey(node.key);

/** @type {(node: estree.Node) => boolean} */
export const isMethodProperty = (node) =>
  node.type === "Property" && node.method;

/** @type {(node: estree.Node) => boolean} */
export const isAccessorProperty = (node) =>
  node.type === "Property" && node.kind !== "init";

/** @type {(node: estree.Node) => boolean} */
export const isSuperProperty = (node) =>
  isMethodProperty(node) || isAccessorProperty(node);
