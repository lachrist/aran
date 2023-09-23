const { String } = globalThis;

/** @type {(node: estree.Node) => string} */
export const getStaticKey = (node) => {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "PrivateIdentifier":
      return node.name;
    case "Literal":
      return String(node.value);
    default:
      return "";
  }
};
