export const hasDirectEvalCall = (node) => {
  let length = 1;
  const nodes = [node];
  while (length > 0) {
    length -= 1;
    const node = nodes[length];
    if (isArray(node)) {
      for (let index = 0; index < node.length; index += 1) {
        nodes[length] = node[index];
        length += 1;
      }
    } else if (typeof node === "object" && node !== null) {
      const keys = ownKeys(node);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        nodes[length] = node[index];
      }
    }
  }
};
