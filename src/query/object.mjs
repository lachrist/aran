export const isProtoKey = (node) => {
  if (node.type === "Identifier") {
    return node.name === "__proto__";
  } else if (node.type === "Literal") {
    return node.value === "__proto__";
  } /* c8 ignore start */ else {
    return false;
  } /* c8 ignore stop */
};

export const isPrototypeProperty = (node) =>
  node.type === "Property" &&
  node.kind === "init" &&
  !node.method &&
  !node.computed &&
  isProtoKey(node.key);

export const isMethodProperty = (node) =>
  node.type === "Property" && node.method;

export const isAccessorProperty = (node) =>
  node.type === "Property" && node.kind !== "init";

export const isSuperProperty = (node) =>
  isMethodProperty(node) || isAccessorProperty(node);
